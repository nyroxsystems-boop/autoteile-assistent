"""Run the DB-backed job queue for external sync.

Intended to be run as a separate Render worker service:
  python manage.py run_jobs

PDFs are stored via a Django FileField in MEDIA_ROOT / configured storage.
Note: Render's default filesystem is ephemeral; for durable PDFs configure a
persistent storage backend (e.g. S3 via django-storages) for MEDIA files.
"""

from __future__ import annotations

import logging
import time
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from extsync.models import ExternalDocument, ExternalOrder, Job, NumberSequence

logger = logging.getLogger('inventree')


def backoff_delay(attempts: int) -> timedelta:
    """Return retry backoff delay for a given attempt count (1-based)."""
    schedule = [
        10,       # 1: 10s
        30,       # 2: 30s
        120,      # 3: 2m
        600,      # 4: 10m
        3600,     # 5: 1h
        10800,    # 6: 3h
        21600,    # 7: 6h
    ]
    seconds = schedule[min(max(attempts, 1), len(schedule)) - 1]
    return timedelta(seconds=seconds)


def _select_next_job() -> Job | None:
    now = timezone.now()
    qs = Job.objects.filter(status=Job.Status.QUEUED, run_at__lte=now).order_by('run_at', 'created_at')

    if connection.features.has_select_for_update:
        kwargs = {}
        if getattr(connection.features, 'has_select_for_update_skip_locked', False):
            kwargs['skip_locked'] = True
        qs = qs.select_for_update(**kwargs)

    return qs.first()


def process_one_job() -> bool:
    """Process a single queued job. Returns True if a job was processed."""
    with transaction.atomic():
        job = _select_next_job()
        if not job:
            return False

        job.status = Job.Status.RUNNING
        job.locked_at = timezone.now()
        job.save(update_fields=['status', 'locked_at', 'updated_at'])

    order_id = job.payload.get('order_id')
    document_id = job.payload.get('document_id')
    log_extra = {
        'job_id': str(job.id),
        'tenant_id': str(job.tenant_id),
        'type': job.type,
        'order_id': str(order_id) if order_id else None,
        'document_id': str(document_id) if document_id else None,
    }
    logger.info('extsync.job.start', extra=log_extra)

    try:
        if job.type == Job.JobType.UPSERT_ORDER:
            _handle_upsert_order(job)
        elif job.type == Job.JobType.GENERATE_DOCUMENT:
            _handle_generate_document(job)
        else:
            raise ValueError(f'Unknown job type: {job.type}')

        job.status = Job.Status.SUCCEEDED
        job.last_error = ''
        job.save(update_fields=['status', 'last_error', 'updated_at'])
        logger.info('extsync.job.succeeded', extra=log_extra)
        return True

    except Exception as exc:  # noqa: BLE001
        job.attempts += 1
        job.last_error = f'{type(exc).__name__}: {exc}'

        if job.type == Job.JobType.GENERATE_DOCUMENT:
            document_id = job.payload.get('document_id')
            if document_id:
                ExternalDocument.objects.filter(tenant=job.tenant, id=document_id).update(
                    status=ExternalDocument.Status.FAILED, error=job.last_error
                )

        logger.warning(
            'extsync.job.error',
            extra={
                **log_extra,
                'attempts': job.attempts,
                'max_attempts': job.max_attempts,
            },
            exc_info=True,
        )

        if job.attempts < job.max_attempts:
            job.status = Job.Status.QUEUED
            job.run_at = timezone.now() + backoff_delay(job.attempts)
        else:
            job.status = Job.Status.DEAD

        job.save(update_fields=['status', 'attempts', 'last_error', 'run_at', 'updated_at'])
        return True


def _handle_upsert_order(job: Job) -> None:
    """Process UPSERT_ORDER.

MVP behavior: validate that the order exists and mark job succeeded.
Future: map payload to real WWS entities.
"""
    order_id = job.payload.get('order_id')
    if not order_id:
        raise ValueError('Job payload missing order_id')

    order = ExternalOrder.objects.filter(tenant=job.tenant, id=str(order_id)).first()
    if not order:
        raise ValueError(f'ExternalOrder not found: {order_id}')

    # No-op for MVP: order is already upserted synchronously in the API handler.
    return None


def _next_document_number(tenant, doc_type: str) -> str:
    """Generate the next number for a document type atomically."""
    name = f'ext_{doc_type.lower()}'
    with transaction.atomic():
        seq_qs = NumberSequence.objects.filter(tenant=tenant, name=name)
        if connection.features.has_select_for_update:
            seq_qs = seq_qs.select_for_update()
        seq = seq_qs.first()
        if not seq:
            seq = NumberSequence.objects.create(tenant=tenant, name=name, current=0)
        seq.current += 1
        seq.save(update_fields=['current', 'updated_at'])

        year = timezone.now().year
        prefix = 'R' if doc_type == ExternalDocument.DocumentType.INVOICE else 'A'
        return f'{prefix}-{year}-{seq.current:04d}'


def _render_document_pdf_bytes(doc: ExternalDocument) -> bytes:
    """Render a minimal PDF using WeasyPrint (fallback to HTML bytes if missing)."""
    payload = doc.order.payload or {}
    customer = payload.get('customer') or {}
    lines = payload.get('lines') or []

    lines_html = ''.join(
        f"<tr><td>{(l.get('sku') or '')}</td><td>{(l.get('name') or '')}</td>"
        f"<td style='text-align:right'>{l.get('qty')}</td>"
        f"<td style='text-align:right'>{l.get('unit_price')}</td></tr>"
        for l in lines
    )

    html_content = f"""
    <html>
      <body>
        <h1>{doc.type} {doc.number or ''}</h1>
        <p><strong>Order:</strong> {doc.order.id}</p>
        <h3>Customer</h3>
        <p>{customer.get('name') or ''}<br/>{customer.get('phone') or ''}<br/>{customer.get('email') or ''}</p>
        <h3>Lines</h3>
        <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="6">
          <thead>
            <tr><th>SKU</th><th>Name</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th></tr>
          </thead>
          <tbody>
            {lines_html or '<tr><td colspan=\"4\">No lines</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
    """

    try:
        from weasyprint import HTML

        return HTML(string=html_content).write_pdf()
    except Exception:  # pragma: no cover - keep worker resilient if dependency missing
        return html_content.encode('utf-8')


def _handle_generate_document(job: Job) -> None:
    document_id = job.payload.get('document_id')
    if not document_id:
        raise ValueError('Job payload missing document_id')

    doc = ExternalDocument.objects.select_related('order', 'tenant').filter(tenant=job.tenant, id=document_id).first()
    if not doc:
        raise ValueError(f'ExternalDocument not found: {document_id}')

    if doc.status == ExternalDocument.Status.READY and doc.pdf_file:
        return None

    doc.number = doc.number or _next_document_number(doc.tenant, doc.type)
    pdf_bytes = _render_document_pdf_bytes(doc)
    doc.pdf_file.save(
        f'{doc.type.lower()}-{doc.number or doc.id}.pdf',
        ContentFile(pdf_bytes),
        save=False,
    )
    doc.status = ExternalDocument.Status.READY
    doc.error = ''
    doc.save()


class Command(BaseCommand):
    help = 'Run queued extsync jobs (DB-backed queue)'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Process jobs until queue empty, then exit')
        parser.add_argument('--sleep', type=float, default=1.0, help='Sleep interval when queue is empty (seconds)')

    def handle(self, *args, **options):
        run_once = bool(options['once'])
        sleep_s = float(options['sleep'])

        while True:
            processed = process_one_job()
            if processed:
                continue

            if run_once:
                return

            time.sleep(max(sleep_s, 0.1))

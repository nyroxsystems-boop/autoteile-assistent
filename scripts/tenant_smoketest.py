#!/usr/bin/env python
"""Minimal regression check for tenant + WAWI test flow."""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', 'InvenTree-master', 'src', 'backend'))
sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'InvenTree.settings')

import django  # noqa: E402

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from tenancy.models import Tenant, TenantUser  # noqa: E402
from wawitest.models import Document, WawiConfig  # noqa: E402
from wawitest.services import request_document_create  # noqa: E402
from wawitest.worker import run_job  # noqa: E402


def main():
    tenant, _ = Tenant.objects.get_or_create(slug='smoke', defaults={'name': 'Smoke Tenant', 'status': 'active'})

    User = get_user_model()
    user, _ = User.objects.get_or_create(
        email='smoke@example.com',
        defaults={'username': 'smoke@example.com'},
    )
    user.set_password('changeme')
    user.is_staff = True
    user.save()

    TenantUser.objects.update_or_create(
        tenant=tenant,
        user=user,
        defaults={'role': TenantUser.Role.TENANT_ADMIN, 'is_active': True},
    )

    WawiConfig.objects.update_or_create(
        tenant=tenant,
        defaults={'base_url': 'http://localhost', 'api_token': 'dummy', 'is_active': True},
    )

    doc, job = request_document_create(tenant, order_id='smoke-order', doc_type='invoice', version=1, created_by_user_id=user.id)
    print(f'Queued doc {doc.id} job {job.id}')
    run_job(job.id)

    doc.refresh_from_db()
    assert doc.status == Document.Status.READY, f'Expected READY, got {doc.status}'
    print('Smoke test passed: document READY')


if __name__ == '__main__':
    main()

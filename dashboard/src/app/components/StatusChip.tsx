interface StatusChipProps {
  status: 'waiting' | 'processing' | 'success' | 'error' | 'neutral' | 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending';
  label?: string;
  size?: 'sm' | 'md';
  withDot?: boolean;
}

const statusMapping = {
  new: { variant: 'waiting' as const, label: 'Neu' },
  in_progress: { variant: 'processing' as const, label: 'In Bearbeitung' },
  quoted: { variant: 'neutral' as const, label: 'Angebot gesendet' },
  confirmed: { variant: 'success' as const, label: 'Bestätigt' },
  oem_pending: { variant: 'error' as const, label: '⚠️ OEM-Prüfung' },
};

export function StatusChip({ status, label, size = 'md', withDot = true }: StatusChipProps) {
  // Map customer status to base status
  const mappedStatus = status in statusMapping 
    ? statusMapping[status as keyof typeof statusMapping]
    : { variant: status as 'waiting' | 'processing' | 'success' | 'error' | 'neutral', label: label || status };

  const actualVariant = mappedStatus.variant;
  const actualLabel = label || mappedStatus.label;

  const variants = {
    waiting: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)] border-[var(--status-waiting-border)]',
    processing: 'bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)] border-[var(--status-processing-border)]',
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-border)]',
    error: 'bg-[var(--status-error-bg)] text-[var(--status-error-fg)] border-[var(--status-error-border)]',
    neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-[var(--status-neutral-border)]'
  };

  const dotColors = {
    waiting: 'bg-[var(--status-waiting)]',
    processing: 'bg-[var(--status-processing)]',
    success: 'bg-[var(--status-success)]',
    error: 'bg-[var(--status-error)]',
    neutral: 'bg-[var(--status-neutral)]'
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`
      inline-flex items-center rounded-md border font-medium
      ${variants[actualVariant]}
      ${sizes[size]}
    `}>
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[actualVariant]}`} />
      )}
      {actualLabel}
    </span>
  );
}
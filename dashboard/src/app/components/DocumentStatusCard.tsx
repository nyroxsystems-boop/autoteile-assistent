import { FileText, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { StatusChip } from './StatusChip';

interface DocumentStatusCardProps {
  documentType: 'invoice' | 'receipt' | 'order_confirmation';
  documentNumber: string;
  customerName: string;
  amount?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  date: string;
  onClick?: () => void;
}

const documentTypeLabels = {
  invoice: 'Rechnung',
  receipt: 'Beleg',
  order_confirmation: 'Auftragsbestätigung',
};

const statusConfig = {
  draft: { label: 'Entwurf', variant: 'neutral' as const, icon: Clock },
  sent: { label: 'Versendet', variant: 'processing' as const, icon: CheckCircle2 },
  paid: { label: 'Bezahlt', variant: 'success' as const, icon: CheckCircle2 },
  overdue: { label: 'Überfällig', variant: 'error' as const, icon: AlertCircle },
  cancelled: { label: 'Storniert', variant: 'error' as const, icon: XCircle },
};

export function DocumentStatusCard({
  documentType,
  documentNumber,
  customerName,
  amount,
  status,
  date,
  onClick,
}: DocumentStatusCardProps) {
  const StatusIcon = statusConfig[status].icon;

  return (
    <button
      onClick={onClick}
      className="w-full p-5 rounded-lg border border-border bg-card hover:bg-accent hover:border-border-strong transition-all duration-150 text-left group"
    >
      <div className="flex items-start gap-4">
        {/* Document Icon */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {documentTypeLabels[documentType]}
              </div>
              <div className="font-medium text-foreground font-mono text-sm">
                {documentNumber}
              </div>
            </div>
            {amount && (
              <div className="font-semibold text-foreground tabular-nums whitespace-nowrap">
                {amount}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            {customerName}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <StatusChip 
              status={statusConfig[status].variant} 
              label={statusConfig[status].label} 
              size="sm" 
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{date}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

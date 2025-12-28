import { MessageSquare } from 'lucide-react';
import { StatusChip } from './StatusChip';

interface CustomerThreadRowProps {
  customerName: string;
  lastMessage: string;
  oemNumbers?: string[];
  status: 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending';
  timestamp: string;
  onClick?: () => void;
  className?: string;
}

const statusLabels = {
  new: 'Neu',
  in_progress: 'In Bearbeitung',
  quoted: 'Angebot gesendet',
  confirmed: 'Bestätigt',
  oem_pending: '⚠️ OEM-Prüfung',
};

const statusVariants = {
  new: 'waiting' as const,
  in_progress: 'processing' as const,
  quoted: 'neutral' as const,
  confirmed: 'success' as const,
  oem_pending: 'error' as const,
};

export function CustomerThreadRow({
  customerName,
  lastMessage,
  oemNumbers = [],
  status,
  timestamp,
  onClick,
  className = '',
}: CustomerThreadRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-5 rounded-lg border border-border bg-card hover:bg-accent hover:border-border-strong transition-all duration-150 text-left group ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* WhatsApp Icon */}
        <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-[#25D366]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="font-medium text-foreground">{customerName}</div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</div>
          </div>

          <div className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {lastMessage}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <StatusChip status={statusVariants[status]} label={statusLabels[status]} size="sm" />
            {oemNumbers.length > 0 && (
              <div className="flex items-center gap-2">
                {oemNumbers.slice(0, 2).map((oem, index) => (
                  <span key={index} className="px-2 py-1 rounded-md bg-muted text-xs font-mono">
                    {oem}
                  </span>
                ))}
                {oemNumbers.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{oemNumbers.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
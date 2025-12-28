import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Backend nicht erreichbar',
  description = 'Der Backend-Service ist momentan nicht verfügbar. Bitte versuche es in wenigen Augenblicken erneut.',
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-xl bg-[var(--status-error-bg)] border border-[var(--status-error-border)] flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-[var(--status-error)]" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2.5">{title}</h3>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

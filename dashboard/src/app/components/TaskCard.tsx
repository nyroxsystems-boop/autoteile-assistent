import { ReactNode } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface TaskCardProps {
  title: string;
  count: number;
  variant?: 'warning' | 'error' | 'success' | 'processing' | 'default';
  icon?: ReactNode;
  onClick?: () => void;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
}

export function TaskCard({
  title,
  count,
  variant = 'default',
  icon,
  onClick,
  trend,
  subtitle,
}: TaskCardProps) {
  const variantStyles = {
    warning: 'border-[var(--status-waiting-border)] bg-[var(--status-waiting-bg)] hover:bg-[var(--status-waiting-bg)]/80',
    error: 'border-[var(--status-error-border)] bg-[var(--status-error-bg)] hover:bg-[var(--status-error-bg)]/80',
    success: 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] hover:bg-[var(--status-success-bg)]/80',
    processing: 'border-[var(--status-processing-border)] bg-[var(--status-processing-bg)] hover:bg-[var(--status-processing-bg)]/80',
    default: 'border-border bg-card hover:bg-accent',
  };

  const iconStyles = {
    warning: 'bg-[var(--status-waiting)] text-white',
    error: 'bg-[var(--status-error)] text-white',
    success: 'bg-[var(--status-success)] text-white',
    processing: 'bg-[var(--status-processing)] text-white',
    default: 'bg-muted text-muted-foreground',
  };

  const countStyles = {
    warning: 'text-[var(--status-waiting-fg)]',
    error: 'text-[var(--status-error-fg)]',
    success: 'text-[var(--status-success-fg)]',
    processing: 'text-[var(--status-processing-fg)]',
    default: 'text-foreground',
  };

  const trendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (value < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full rounded-lg border p-4 
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        text-left
        ${variantStyles[variant]}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconStyles[variant]} transition-transform duration-200 group-hover:scale-110`}>
                <div className="w-4 h-4">
                  {icon}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-foreground/90 mb-1 leading-tight">
            {title}
          </div>
          
          <div className={`text-2xl font-semibold tabular-nums ${countStyles[variant]}`}>
            {count}
          </div>

          {subtitle && (
            <div className="text-sm text-foreground/70 leading-tight">
              {subtitle}
            </div>
          )}

          {trend && (
            <div className="flex items-center gap-1 text-sm text-foreground/70 leading-tight">
              {trendIcon(trend.value)}
              {trend.value} {trend.label}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/50 text-foreground/50 group-hover:text-foreground group-hover:bg-white transition-all duration-200">
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}
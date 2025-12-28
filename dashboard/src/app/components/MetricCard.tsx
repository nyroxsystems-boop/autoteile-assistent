import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
  size = 'md',
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border bg-card hover:border-border-strong',
    primary: 'border-[var(--status-processing-border)] bg-card hover:bg-[var(--status-processing-bg)]',
    success: 'border-[var(--status-success-border)] bg-card hover:bg-[var(--status-success-bg)]',
    warning: 'border-[var(--status-waiting-border)] bg-card hover:bg-[var(--status-waiting-bg)]',
    error: 'border-[var(--status-error-border)] bg-card hover:bg-[var(--status-error-bg)]',
  };

  const iconContainerStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-[var(--status-processing-bg)] text-[var(--status-processing-fg)]',
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]',
    warning: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)]',
    error: 'bg-[var(--status-error-bg)] text-[var(--status-error-fg)]',
  };

  const sizeStyles = {
    sm: { padding: 'p-5', valueSize: 'text-2xl', iconSize: 'w-9 h-9', iconInner: 'w-4 h-4' },
    md: { padding: 'p-6', valueSize: 'text-3xl', iconSize: 'w-10 h-10', iconInner: 'w-5 h-5' },
    lg: { padding: 'p-7', valueSize: 'text-4xl', iconSize: 'w-11 h-11', iconInner: 'w-5 h-5' },
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-3 h-3" />;
    return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-[var(--status-success-fg)]' : 'text-[var(--status-error-fg)]';
  };

  return (
    <div
      className={`
        group relative rounded-xl border transition-all duration-300 overflow-hidden
        hover:shadow-lg hover:-translate-y-0.5
        ${variantStyles[variant]}
        ${sizeStyles[size].padding}
      `}
    >
      {/* Subtle gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />
      
      {/* Content container */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-5">
          {icon && (
            <div className={`
              ${sizeStyles[size].iconSize} rounded-xl flex items-center justify-center 
              ${iconContainerStyles[variant]} 
              ring-4 ring-white/50
              transition-all duration-300 
              group-hover:scale-110 group-hover:rotate-3
              shadow-sm
            `}>
              <div className={sizeStyles[size].iconInner}>
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-muted-foreground font-medium mb-1.5" style={{ fontSize: '0.8125rem', letterSpacing: '0.025em' }}>
              {label}
            </div>
            {(change !== undefined || changeLabel) && (
              <div className="flex items-center gap-2">
                {change !== undefined && (
                  <div className={`flex items-center gap-1 font-semibold ${getTrendColor()}`} style={{ fontSize: '0.75rem' }}>
                    {getTrendIcon()}
                    <span>
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  </div>
                )}
                {changeLabel && (
                  <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{changeLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`font-semibold tabular-nums tracking-tight ${sizeStyles[size].valueSize} transition-all duration-300 group-hover:scale-105`}>
          {value}
        </div>
      </div>
      
      {/* Accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
}
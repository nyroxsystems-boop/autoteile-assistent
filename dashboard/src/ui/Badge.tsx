import React from 'react';
import { cn } from './utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className, ...rest }) => {
  return <span className={cn('ui-badge', `ui-badge-${variant}`, className)} {...rest}>{children}</span>;
};

export default Badge;

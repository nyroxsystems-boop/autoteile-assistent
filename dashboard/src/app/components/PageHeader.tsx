import { ReactNode } from 'react';
import { Search, Command } from 'lucide-react';
import { Input } from './ui/input';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}

export function PageHeader({
  title,
  description,
  badge,
  action,
  showSearch = false,
  searchPlaceholder = 'Suchen...',
  onSearch,
}: PageHeaderProps) {
  return (
    <div className="mb-10 space-y-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2.5">
            <h1 className="truncate">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      
      {showSearch && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            className="pl-11 pr-20 h-11 bg-background border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
            <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border font-medium">
              <Command className="w-3 h-3" />
            </kbd>
            <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border font-medium">K</kbd>
          </div>
        </div>
      )}
    </div>
  );
}
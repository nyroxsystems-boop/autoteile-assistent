import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

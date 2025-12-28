import { MessageSquare, FileText, Package, CheckCircle2, Clock } from 'lucide-react';
import { StatusChip } from './StatusChip';

interface ActivityItem {
  id: string;
  type: 'message' | 'quote' | 'order' | 'completed';
  customer: string;
  description: string;
  time: string;
  status?: 'waiting' | 'processing' | 'success' | 'error';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap = {
  message: MessageSquare,
  quote: FileText,
  order: Package,
  completed: CheckCircle2,
};

const iconColorMap = {
  message: 'text-[var(--status-processing)]',
  quote: 'text-[var(--status-waiting)]',
  order: 'text-[var(--status-processing)]',
  completed: 'text-[var(--status-success)]',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-foreground">Letzte Aktivitäten</h3>
          <p className="text-sm text-muted-foreground mt-1">Live Updates</p>
        </div>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="space-y-3 overflow-y-auto flex-1">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          const iconColor = iconColorMap[activity.type];
          
          return (
            <div 
              key={activity.id}
              className="flex gap-4 p-3 rounded-lg hover:bg-accent transition-colors group relative"
            >
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-[25px] top-[52px] bottom-[-16px] w-px bg-border" />
              )}
              
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center ${iconColor} relative z-10`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-foreground">
                    {activity.customer}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                {activity.status && (
                  <div className="mt-2">
                    <StatusChip 
                      status={activity.status} 
                      label={
                        activity.status === 'waiting' ? 'Wartet' :
                        activity.status === 'processing' ? 'In Arbeit' :
                        activity.status === 'success' ? 'Erledigt' :
                        'Problem'
                      }
                      size="sm" 
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { Check, Circle } from 'lucide-react';

interface TimelineStep {
  label: string;
  completed: boolean;
  current?: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="space-y-5">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`
                flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-200
                ${step.completed 
                  ? 'bg-[var(--status-success)] border-[var(--status-success)] text-white shadow-sm' 
                  : step.current
                  ? 'bg-[var(--status-processing)] border-[var(--status-processing)] text-white shadow-sm'
                  : 'bg-background border-border text-muted-foreground'
                }
              `}
            >
              {step.completed ? (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Circle className="w-2.5 h-2.5 fill-current" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-0.5 h-10 transition-colors ${step.completed ? 'bg-[var(--status-success)]' : 'bg-border'}`} />
            )}
          </div>
          <div className="flex-1 pt-1">
            <div className={`leading-relaxed ${step.current ? 'font-semibold text-foreground' : step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
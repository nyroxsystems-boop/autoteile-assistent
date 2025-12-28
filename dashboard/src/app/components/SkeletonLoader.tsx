export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
          <div className="h-6 bg-muted rounded-full w-20" />
          <div className="h-8 bg-muted rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-card border border-border rounded-xl animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-20 bg-muted rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="space-y-2">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

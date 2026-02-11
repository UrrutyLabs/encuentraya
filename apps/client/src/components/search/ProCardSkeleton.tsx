import { Card } from "@repo/ui";

export function ProCardSkeleton() {
  return (
    <Card className="animate-pulse overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Left: Avatar */}
        <div className="w-32 h-32 rounded-full bg-muted/30 shrink-0" />

        {/* Center: Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* First row: Name + Rating */}
          <div className="flex items-center gap-2">
            <div className="h-6 bg-muted/30 rounded w-1/2" />
            <div className="flex gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-muted/30 rounded" />
              ))}
            </div>
          </div>

          {/* Second row: Top Pro + Rating number + Review count */}
          <div className="flex items-center gap-2">
            <div className="h-5 bg-muted/30 rounded-full w-16" />
            <div className="h-4 bg-muted/30 rounded w-8" />
            <div className="h-4 bg-muted/30 rounded w-12" />
          </div>

          {/* Third row: Availability + Response time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
          </div>

          {/* Fourth row: Completed Jobs */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted/30 rounded" />
            <div className="h-4 bg-muted/30 rounded w-32" />
          </div>

          {/* Fifth row: Location */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted/30 rounded" />
            <div className="h-4 bg-muted/30 rounded w-2/3" />
          </div>
        </div>

        {/* Right: Rate only */}
        <div className="shrink-0">
          <div className="h-4 bg-muted/30 rounded w-20" />
        </div>
      </div>

      {/* Footer: Bio + Button skeleton */}
      <div className="flex gap-4 px-4 py-3">
        <div className="w-32 shrink-0" />
        <div className="flex-1 min-w-0 border border-muted/20 bg-muted/10 px-3 py-2 min-h-[52px] flex items-center animate-pulse">
          <div className="h-4 bg-muted/50 rounded w-4/5" />
        </div>
        <div className="h-9 bg-muted/30 rounded w-24 shrink-0" />
      </div>
    </Card>
  );
}

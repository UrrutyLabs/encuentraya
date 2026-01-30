import { Card } from "@repo/ui";

export function ProCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex gap-4 p-4">
        {/* Left: Avatar */}
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-muted/30 shrink-0" />

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

        {/* Right: Rate + Button */}
        <div className="flex flex-col justify-between items-end shrink-0 gap-3">
          {/* Top: Rate/hour */}
          <div className="h-4 bg-muted/30 rounded w-20" />

          {/* Bottom: Button */}
          <div className="h-10 bg-muted/30 rounded w-24" />
        </div>
      </div>
    </Card>
  );
}

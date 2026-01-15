import { Card } from "@repo/ui";

export function ReviewCreateSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-muted/30 rounded animate-pulse" />
        <div className="h-8 bg-muted/30 rounded w-48 animate-pulse" />
      </div>

      {/* Booking Info Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-40" />
        </div>
        <div className="space-y-3">
          <div>
            <div className="h-4 bg-muted/30 rounded w-24 mb-1" />
            <div className="h-5 bg-muted/30 rounded w-64" />
          </div>
          <div>
            <div className="h-4 bg-muted/30 rounded w-32 mb-1" />
            <div className="h-5 bg-muted/30 rounded w-48" />
          </div>
        </div>
      </Card>

      {/* Review Form Card */}
      <Card className="p-6 animate-pulse">
        <div className="space-y-6">
          {/* Rating */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-32" />
            </div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-muted/30 rounded" />
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="h-24 bg-muted/30 rounded w-full" />
          </div>

          {/* Support Contact */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted/30 rounded" />
            <div className="h-4 bg-muted/30 rounded w-64" />
          </div>

          {/* What Happened (conditional) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-40" />
            </div>
            <div className="h-20 bg-muted/30 rounded w-full" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-muted/30 rounded flex-1" />
            <div className="h-10 bg-muted/30 rounded flex-1" />
          </div>
        </div>
      </Card>
    </div>
  );
}

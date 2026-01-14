import { Card } from "@repo/ui";

export function ProProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Pro Header Skeleton */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex-1">
            {/* Name */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-muted/30 rounded" />
              <div className="h-8 bg-muted/30 rounded w-48" />
            </div>
            {/* Service Area */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-32" />
            </div>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="h-6 bg-muted/30 rounded-full w-20" />
              <div className="h-6 bg-muted/30 rounded-full w-24" />
            </div>
          </div>
          {/* Price and Rating */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <div className="w-5 h-5 bg-muted/30 rounded" />
              <div className="h-7 bg-muted/30 rounded w-24" />
            </div>
            <div className="flex items-center justify-end gap-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
          </div>
        </div>
        {/* Button */}
        <div className="h-10 bg-muted/30 rounded w-full md:w-32" />
      </Card>

      {/* About Section Skeleton */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-32" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted/30 rounded w-full" />
          <div className="h-4 bg-muted/30 rounded w-5/6" />
        </div>
      </Card>

      {/* Reviews Section Skeleton */}
      <Card className="p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-24" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 bg-muted/30 rounded w-32" />
          <div className="w-4 h-4 bg-muted/30 rounded" />
          <div className="h-4 bg-muted/30 rounded w-24" />
        </div>
      </Card>
    </div>
  );
}

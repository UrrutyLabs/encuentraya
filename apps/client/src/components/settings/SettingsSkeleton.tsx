import { Card } from "@repo/ui";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-48 animate-pulse" />
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-16" />
              </div>
              <div className="h-5 bg-muted/30 rounded w-64" />
              <div className="h-3 bg-muted/30 rounded w-48" />
            </div>
            <div>
              <div className="h-4 bg-muted/30 rounded w-20 mb-2" />
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-32" />
              </div>
              <div className="h-5 bg-muted/30 rounded w-40" />
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-64 animate-pulse" />
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-muted/30 rounded w-48 mb-2" />
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-56 animate-pulse" />
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted/30 rounded" />
                  <div className="h-4 bg-muted/30 rounded w-32" />
                </div>
                <div className="h-4 bg-muted/30 rounded w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Security Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-56 animate-pulse" />
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded w-full" />
            ))}
          </div>
        </Card>
      </div>

      {/* Help Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-48 animate-pulse" />
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

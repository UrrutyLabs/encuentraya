import { Card } from "@repo/ui";

export function BookingDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted/30 rounded w-48 mb-2 animate-pulse" />
          <div className="h-6 bg-muted/30 rounded-full w-24 animate-pulse" />
        </div>
        <div className="h-10 bg-muted/30 rounded w-24 animate-pulse" />
      </div>

      {/* Booking Summary */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted/30 rounded w-24 mb-2" />
              <div className="h-5 bg-muted/30 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-4 h-4 bg-muted/30 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-muted/30 rounded w-32 mb-2" />
                <div className="h-4 bg-muted/30 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Address */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="h-5 bg-muted/30 rounded w-full" />
      </Card>

      {/* Client Info */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted/30 rounded w-20 mb-1" />
              <div className="h-5 bg-muted/30 rounded w-48" />
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="flex gap-4">
          <div className="h-10 bg-muted/30 rounded w-40" />
          <div className="h-10 bg-muted/30 rounded w-32" />
        </div>
      </Card>
    </div>
  );
}

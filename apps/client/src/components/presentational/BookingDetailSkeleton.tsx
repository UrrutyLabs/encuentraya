import { Card } from "@repo/ui";

export function BookingDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header: Back button and Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 bg-muted/30 rounded w-24 animate-pulse" />
        <div className="h-6 bg-muted/30 rounded-full w-28 animate-pulse" />
      </div>

      {/* Title */}
      <div className="h-8 bg-muted/30 rounded w-48 mb-6 animate-pulse" />

      {/* Pro Summary Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-32" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-5 bg-muted/30 rounded w-40 mb-2" />
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
          </div>
          <div className="h-10 bg-muted/30 rounded w-28" />
        </div>
      </Card>

      {/* Booking Details Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-32" />
          </div>
          {/* Date */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-48" />
          </div>
          {/* Address */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-full" />
          </div>
          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-28" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-16" />
          </div>
          {/* Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/30 rounded w-full" />
              <div className="h-4 bg-muted/30 rounded w-5/6" />
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Summary Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-40" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted/30 rounded w-32" />
            <div className="h-4 bg-muted/30 rounded w-20" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-muted/30 rounded w-32" />
            <div className="h-4 bg-muted/30 rounded w-8" />
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <div className="h-5 bg-muted/30 rounded w-32" />
              <div className="h-6 bg-muted/30 rounded w-24" />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions Card */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="h-10 bg-muted/30 rounded w-40" />
      </Card>
    </div>
  );
}

import { Card } from "@repo/ui";

export function CheckoutSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <div className="h-8 bg-muted/30 rounded w-48 mb-6 animate-pulse" />

      {/* Booking Summary Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-48" />
        </div>
        <div className="space-y-3">
          {/* Date and Time */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-32" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-64" />
          </div>
          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-full" />
          </div>
          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
            <div className="h-5 bg-muted/30 rounded w-16" />
          </div>
        </div>
      </Card>

      {/* Payment Summary Card */}
      <Card className="p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-40" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted/30 rounded w-32" />
            <div className="h-4 bg-muted/30 rounded w-24" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-muted/30 rounded w-32" />
            <div className="h-4 bg-muted/30 rounded w-16" />
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <div className="h-5 bg-muted/30 rounded w-32" />
              <div className="h-6 bg-muted/30 rounded w-32" />
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Authorization Card */}
      <Card className="p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded" />
          <div className="h-6 bg-muted/30 rounded w-56" />
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-muted/30 rounded w-full" />
          <div className="h-4 bg-muted/30 rounded w-5/6" />
          <div className="h-10 bg-muted/30 rounded w-full md:w-64" />
        </div>
      </Card>
    </div>
  );
}

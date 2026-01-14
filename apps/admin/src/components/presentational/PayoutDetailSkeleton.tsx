import { Card } from "@repo/ui";

export function PayoutDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted/30 rounded w-40 mb-2 animate-pulse" />
          <div className="h-6 bg-muted/30 rounded-full w-24 animate-pulse" />
        </div>
        <div className="h-10 bg-muted/30 rounded w-24 animate-pulse" />
      </div>

      {/* Payout Summary */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted/30 rounded w-32 mb-2" />
              <div className="h-5 bg-muted/30 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Earnings List */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-40 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-muted/30 rounded w-32" />
                <div className="h-4 bg-muted/30 rounded w-24" />
              </div>
              <div className="h-4 bg-muted/30 rounded w-48" />
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="h-10 bg-muted/30 rounded w-40" />
      </Card>
    </div>
  );
}

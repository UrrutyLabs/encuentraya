import { Card } from "@repo/ui";

export function PaymentDetailSkeleton() {
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

      {/* Payment Summary */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted/30 rounded w-32 mb-2" />
              <div className="h-5 bg-muted/30 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Amounts */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-muted/30 rounded w-32 mb-2" />
              <div className="h-5 bg-muted/30 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Webhook Events */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-40 mb-4" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-md p-4">
              <div className="h-4 bg-muted/30 rounded w-32 mb-2" />
              <div className="h-4 bg-muted/30 rounded w-48 mb-3" />
              <div className="h-20 bg-muted/30 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-24 mb-4" />
        <div className="h-10 bg-muted/30 rounded w-48" />
      </Card>
    </div>
  );
}

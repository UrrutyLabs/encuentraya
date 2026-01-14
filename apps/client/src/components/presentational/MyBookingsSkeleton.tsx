import { Card } from "@repo/ui";

export function MyBookingsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Upcoming Bookings Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={`upcoming-${i}`} className="animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="h-6 bg-muted/30 rounded w-32" />
                <div className="flex gap-2 items-center">
                  <div className="h-5 bg-muted/30 rounded-full w-24" />
                  <div className="h-5 bg-muted/30 rounded-full w-20" />
                </div>
              </div>
              <div className="space-y-2 mb-2">
                <div className="h-4 bg-muted/30 rounded w-full" />
                <div className="h-4 bg-muted/30 rounded w-5/6" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-40" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted/30 rounded w-16" />
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-muted/30 rounded w-20" />
                  <div className="h-4 bg-muted/30 rounded w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Past Bookings Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted/30 rounded animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-20 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={`past-${i}`} className="animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="h-6 bg-muted/30 rounded w-32" />
                <div className="flex gap-2 items-center">
                  <div className="h-5 bg-muted/30 rounded-full w-24" />
                  <div className="h-5 bg-muted/30 rounded-full w-20" />
                </div>
              </div>
              <div className="space-y-2 mb-2">
                <div className="h-4 bg-muted/30 rounded w-full" />
                <div className="h-4 bg-muted/30 rounded w-5/6" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-40" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted/30 rounded w-16" />
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-muted/30 rounded w-20" />
                  <div className="h-4 bg-muted/30 rounded w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

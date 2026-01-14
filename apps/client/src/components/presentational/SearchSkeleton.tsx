import { Card } from "@/components/ui/Card";

export function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          {/* Name and Badge */}
          <div className="flex justify-between items-start mb-2">
            <div className="h-6 bg-muted/30 rounded w-3/4" />
            <div className="h-5 bg-muted/30 rounded-full w-16" />
          </div>

          {/* Service Area */}
          <div className="h-4 bg-muted/30 rounded w-2/3 mb-2" />

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="h-5 bg-muted/30 rounded-full w-20" />
            <div className="h-5 bg-muted/30 rounded-full w-24" />
          </div>

          {/* Hourly Rate and Rating */}
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted/30 rounded w-24" />
            <div className="h-4 bg-muted/30 rounded w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

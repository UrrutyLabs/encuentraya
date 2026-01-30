import { Card } from "@repo/ui";

export function JobCreateSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Title and Subtitle */}
      <div className="mb-6">
        <div className="h-8 bg-muted/30 rounded w-64 mb-2 animate-pulse" />
        <div className="h-5 bg-muted/30 rounded w-96 animate-pulse" />
      </div>

      {/* Form Card */}
      <Card className="p-6 animate-pulse">
        <div className="space-y-6">
          {/* Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-24" />
            </div>
            <div className="h-10 bg-muted/30 rounded w-full" />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-16" />
              </div>
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-muted/30 rounded" />
                <div className="h-4 bg-muted/30 rounded w-16" />
              </div>
              <div className="h-10 bg-muted/30 rounded w-full" />
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-20" />
            </div>
            <div className="h-10 bg-muted/30 rounded w-full" />
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-28" />
            </div>
            <div className="h-10 bg-muted/30 rounded w-full md:w-32" />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-muted/30 rounded" />
              <div className="h-4 bg-muted/30 rounded w-32" />
            </div>
            <div className="h-24 bg-muted/30 rounded w-full" />
          </div>

          {/* Estimated Cost */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-muted/30 rounded w-40" />
              <div className="h-6 bg-muted/30 rounded w-32" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="h-10 bg-muted/30 rounded w-full md:w-48" />
        </div>
      </Card>
    </div>
  );
}

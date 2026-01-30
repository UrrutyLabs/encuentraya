"use client";

import { Card } from "@repo/ui";

export function CategoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted/30 rounded w-64 animate-pulse" />
          <div className="h-6 bg-muted/30 rounded w-32 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-muted/30 rounded w-24 animate-pulse" />
          <div className="h-10 bg-muted/30 rounded w-24 animate-pulse" />
        </div>
      </div>

      <Card className="p-6">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted/30 rounded w-24 animate-pulse" />
              <div className="h-5 bg-muted/30 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

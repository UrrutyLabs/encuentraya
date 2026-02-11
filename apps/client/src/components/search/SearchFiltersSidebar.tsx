"use client";

import { Card } from "@repo/ui";
import { AvailabilityFilterSection } from "./AvailabilityFilterSection";

interface SearchFiltersSidebarProps {
  categoryId?: string;
  subcategorySlug?: string;
}

/**
 * SearchFiltersSidebar Component
 *
 * Container component that renders:
 * - Static availability filter section (date, time windows)
 *
 * categoryId and subcategorySlug are kept for future use.
 */
export function SearchFiltersSidebar({
  categoryId: _categoryId,
  subcategorySlug: _subcategorySlug,
}: SearchFiltersSidebarProps) {
  // Don't render when no category (sidebar is only shown with category context)
  if (!_categoryId) {
    return null;
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-6">
        <AvailabilityFilterSection />
      </div>
    </Card>
  );
}

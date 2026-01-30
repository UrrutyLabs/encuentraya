"use client";

import { memo } from "react";
import { type Pro } from "@repo/domain";
import { ProCard } from "@/components/presentational/ProCard";
import { ProCardSkeleton } from "./ProCardSkeleton";

/**
 * ProList Component
 *
 * Displays a single-column list of professional cards.
 * Shows loading skeletons while data is being fetched.
 *
 * @example
 * ```tsx
 * <ProList pros={pros} isLoading={false} />
 * ```
 */
interface ProListProps {
  /** Array of professionals to display */
  pros: Pro[];
  /** Whether the list is currently loading */
  isLoading?: boolean;
  /** Category slug to pass to pro profile URLs */
  categorySlug?: string;
  /** Subcategory slug to pass to pro profile URLs */
  subcategorySlug?: string;
}

export const ProList = memo(function ProList({
  pros,
  isLoading,
  categorySlug,
  subcategorySlug,
}: ProListProps) {
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-label="Cargando profesionales"
      >
        {[1, 2, 3].map((i) => (
          <ProCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (pros.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  return (
    <div className="space-y-4" role="list">
      {pros.map((pro) => (
        <div key={pro.id} role="listitem">
          <ProCard
            pro={pro}
            categorySlug={categorySlug}
            subcategorySlug={subcategorySlug}
          />
        </div>
      ))}
    </div>
  );
});

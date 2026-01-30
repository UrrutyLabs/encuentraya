"use client";

import { useMemo } from "react";
import { Text } from "@repo/ui";
import type { Category } from "@repo/domain";
import type { Subcategory } from "@repo/domain";
import type { Pro } from "@repo/domain";

interface ServiceDetailsStepHeaderProps {
  category: Category | null;
  subcategory: Subcategory | null;
  pro: Pro;
}

/**
 * ServiceDetailsStepHeader Component
 *
 * Displays the header for ServiceDetailsStep with:
 * - Title: "Detalles del servicio"
 * - Category/Subcategory breadcrumb
 * - Pro name and hourly rate
 */
export function ServiceDetailsStepHeader({
  category,
  subcategory,
  pro,
}: ServiceDetailsStepHeaderProps) {
  // Build category/subcategory display text
  const categoryDisplayText = useMemo(() => {
    const parts: string[] = [];
    if (category) {
      parts.push(category.name);
    }
    if (subcategory) {
      parts.push(subcategory.name);
    }
    return parts.join(" > ");
  }, [category, subcategory]);

  return (
    <div className="mb-6">
      <Text variant="h1" className="text-primary text-center mb-2">
        Detalles del servicio
      </Text>
      {/* Category/Subcategory as fixed text */}
      {categoryDisplayText && (
        <Text variant="body" className="text-muted text-center mb-2">
          {categoryDisplayText}
        </Text>
      )}
      <Text variant="body" className="text-muted text-center">
        Con {pro.name} - ${pro.hourlyRate.toFixed(0)}/hora
      </Text>
    </div>
  );
}

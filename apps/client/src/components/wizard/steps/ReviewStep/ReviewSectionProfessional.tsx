"use client";

import { User, Filter } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { ReviewInfoRow } from "./ReviewInfoRow";

interface ReviewSectionProfessionalProps {
  proName: string;
  categoryName: string;
}

/**
 * Section 1: Professional info (pro name + category)
 * Wrapped in its own Card
 */
export function ReviewSectionProfessional({
  proName,
  categoryName,
}: ReviewSectionProfessionalProps) {
  return (
    <Card className="p-4 md:p-6 mb-4 md:mb-6">
      <section aria-labelledby="review-section-professional">
        <Text
          id="review-section-professional"
          variant="small"
          className="text-muted font-semibold uppercase tracking-wide mb-3 md:mb-4 block"
        >
          Profesional
        </Text>
        <div className="space-y-2">
          <ReviewInfoRow icon={User} label="Profesional" value={proName} />
          <ReviewInfoRow icon={Filter} label="Categoría" value={categoryName} />
        </div>
      </section>
    </Card>
  );
}

"use client";

import { MapPin, Hourglass } from "lucide-react";
import { Text } from "@repo/ui";
import { ReviewInfoRow } from "./ReviewInfoRow";

interface ReviewSectionLocationProps {
  address: string;
  hours: string;
}

/**
 * Section 2 (part 2): Ubicación y duración
 * Note: No Card wrapper - wrapped by parent component
 */
export function ReviewSectionLocation({
  address,
  hours,
}: ReviewSectionLocationProps) {
  return (
    <section aria-labelledby="review-section-location">
      <Text
        id="review-section-location"
        variant="small"
        className="text-muted font-semibold uppercase tracking-wide mb-3 md:mb-4 block"
      >
        Ubicación y duración
      </Text>
      <div className="space-y-2">
        <ReviewInfoRow icon={MapPin} label="Dirección" value={address} />
        <ReviewInfoRow
          icon={Hourglass}
          label="Horas estimadas"
          value={`${hours} horas`}
        />
      </div>
    </section>
  );
}

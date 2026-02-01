"use client";

import { MapPin, Hourglass } from "lucide-react";
import { Text } from "@repo/ui";
import { ReviewInfoRow } from "./ReviewInfoRow";

interface ReviewSectionLocationProps {
  address: string;
  hours: string;
  isFixedPrice?: boolean;
}

/**
 * Section 2 (part 2): Ubicación y duración
 * Note: No Card wrapper - wrapped by parent component
 */
export function ReviewSectionLocation({
  address,
  hours,
  isFixedPrice = false,
}: ReviewSectionLocationProps) {
  const durationValue = isFixedPrice
    ? "El profesional te enviará un presupuesto"
    : `${hours} horas`;
  const durationLabel = isFixedPrice ? "Presupuesto" : "Horas estimadas";

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
          label={durationLabel}
          value={durationValue}
        />
      </div>
    </section>
  );
}

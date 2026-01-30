"use client";

import { Calendar, Clock } from "lucide-react";
import { Text } from "@repo/ui";

interface ReviewDateTimeRowProps {
  formattedDate: string;
  formattedTime: string;
}

/**
 * Combined Date + Time row for Review step
 * Mobile: vertical layout (icons + label + value stacked)
 * Desktop: horizontal layout (icons | label | value aligned right)
 */
export function ReviewDateTimeRow({
  formattedDate,
  formattedTime,
}: ReviewDateTimeRowProps) {
  const combinedDateTime = `${formattedDate}, ${formattedTime}`;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 min-h-[44px]">
      <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0 mt-0.5 md:mt-0">
          <Calendar className="w-5 h-5 text-muted" aria-hidden />
          <Clock className="w-5 h-5 text-muted" aria-hidden />
        </div>
        <Text variant="small" className="text-muted md:font-medium">
          Fecha y hora
        </Text>
      </div>
      <div className="md:text-right flex-1 md:flex-initial min-w-0 md:min-w-[200px]">
        <Text variant="body" className="font-medium wrap-break-word capitalize">
          {combinedDateTime}
        </Text>
      </div>
    </div>
  );
}

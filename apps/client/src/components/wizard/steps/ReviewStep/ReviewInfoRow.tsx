"use client";

import { type ElementType } from "react";
import { Text } from "@repo/ui";

interface ReviewInfoRowProps {
  icon: ElementType;
  label: string;
  value: string;
  valueClassName?: string;
}

/**
 * Presentational row: icon + label + value (used across review sections)
 * Mobile: vertical layout (icon + label + value stacked)
 * Desktop: horizontal layout (icon | label | value aligned right)
 */
export function ReviewInfoRow({
  icon: Icon,
  label,
  value,
  valueClassName = "",
}: ReviewInfoRowProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 min-h-[44px]">
      <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
        <Icon
          className="w-5 h-5 text-muted shrink-0 mt-0.5 md:mt-0"
          aria-hidden
        />
        <Text variant="small" className="text-muted md:font-medium">
          {label}
        </Text>
      </div>
      <div className="md:text-right flex-1 md:flex-initial min-w-0 md:min-w-[120px]">
        <Text
          variant="body"
          className={`font-medium wrap-break-word ${valueClassName}`}
        >
          {value}
        </Text>
      </div>
    </div>
  );
}

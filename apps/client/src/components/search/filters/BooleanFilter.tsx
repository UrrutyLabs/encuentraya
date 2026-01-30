"use client";

import { useCallback } from "react";
import { Text } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";

interface BooleanFilterProps {
  question: QuickQuestion;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}

/**
 * BooleanFilter Component
 *
 * Renders a boolean (Yes/No) filter for quick questions
 */
export function BooleanFilter({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  question: _question,
  value,
  onChange,
}: BooleanFilterProps) {
  const handleYesClick = useCallback(() => {
    // Toggle: if already true, clear; otherwise set to true
    onChange(value === true ? null : true);
  }, [value, onChange]);

  const handleNoClick = useCallback(() => {
    // Toggle: if already false, clear; otherwise set to false
    onChange(value === false ? null : false);
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <button
        onClick={handleYesClick}
        className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-colors touch-manipulation cursor-pointer ${
          value === true
            ? "bg-primary/10 border-primary text-primary"
            : "bg-surface border-border text-text hover:bg-surface/80"
        }`}
        type="button"
        aria-pressed={value === true}
      >
        <Text variant="body" className="font-medium">
          Sí
        </Text>
      </button>

      <button
        onClick={handleNoClick}
        className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-colors touch-manipulation cursor-pointer ${
          value === false
            ? "bg-primary/10 border-primary text-primary"
            : "bg-surface border-border text-text hover:bg-surface/80"
        }`}
        type="button"
        aria-pressed={value === false}
      >
        <Text variant="body" className="font-medium">
          No
        </Text>
      </button>
    </div>
  );
}

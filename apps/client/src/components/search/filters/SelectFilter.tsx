"use client";

import { useCallback } from "react";
import { Text } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";

interface SelectFilterProps {
  question: QuickQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * SelectFilter Component
 *
 * Renders a multi-select filter for quick questions with options
 */
export function SelectFilter({
  question,
  value = [],
  onChange,
}: SelectFilterProps) {
  const options = question.options || [];

  const handleToggleOption = useCallback(
    (option: string) => {
      const newValue = value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option];
      onChange(newValue);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = value.includes(option);
        return (
          <button
            key={option}
            onClick={() => handleToggleOption(option)}
            className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-colors touch-manipulation cursor-pointer ${
              isSelected
                ? "bg-primary/10 border-primary text-primary"
                : "bg-surface border-border text-text hover:bg-surface/80"
            }`}
            type="button"
            aria-pressed={isSelected}
          >
            <Text variant="body" className="font-medium">
              {option}
            </Text>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, ChangeEvent } from "react";
import { Input } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";

interface NumberFilterProps {
  question: QuickQuestion;
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * NumberFilter Component
 *
 * Renders a number input filter for quick questions
 */
export function NumberFilter({ question, value, onChange }: NumberFilterProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const numValue = e.target.value === "" ? null : Number(e.target.value);
      if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
        onChange(numValue);
      }
    },
    [onChange]
  );

  return (
    <Input
      type="number"
      value={value ?? ""}
      onChange={handleChange}
      placeholder={question.label}
      min={0}
      className="w-full"
    />
  );
}

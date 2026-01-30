"use client";

import { useCallback, ChangeEvent } from "react";
import { Input } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";

interface TextFilterProps {
  question: QuickQuestion;
  value: string;
  onChange: (value: string) => void;
}

/**
 * TextFilter Component
 *
 * Renders a text input filter for quick questions
 */
export function TextFilter({
  question,
  value = "",
  onChange,
}: TextFilterProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={question.label}
      className="w-full"
    />
  );
}

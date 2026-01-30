"use client";

import { useMemo, useCallback } from "react";
import { Text } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";
import {
  BooleanFilter,
  SelectFilter,
  TextFilter,
  NumberFilter,
} from "./filters";

interface DynamicFilterSectionProps {
  question: QuickQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * DynamicFilterSection Component
 *
 * Renders a filter section for a single quick_question
 * Chooses the appropriate filter component based on question.type
 */
export function DynamicFilterSection({
  question,
  value,
  onChange,
}: DynamicFilterSectionProps) {
  // Parse value based on question type
  const parsedValue = useMemo(() => {
    if (value === null || value === undefined || value === "") {
      if (question.type === "boolean") return null;
      if (question.type === "select") return [];
      if (question.type === "number") return null;
      return "";
    }

    if (question.type === "boolean") {
      if (typeof value === "string") {
        return value === "true";
      }
      return value === true;
    }

    if (question.type === "select") {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        // Handle comma-separated string from URL
        return value.split(",").filter(Boolean);
      }
      return [];
    }

    if (question.type === "number") {
      if (typeof value === "string") {
        const num = Number(value);
        return isNaN(num) ? null : num;
      }
      return typeof value === "number" ? value : null;
    }

    // text type
    return String(value);
  }, [value, question.type]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      // Convert value to URL-friendly format
      let urlValue: string | null = null;

      if (question.type === "boolean") {
        if (newValue === true) {
          urlValue = "true";
        } else if (newValue === false) {
          urlValue = "false";
        } else {
          urlValue = null;
        }
      } else if (question.type === "select") {
        const arr = newValue as string[];
        urlValue = arr.length > 0 ? arr.join(",") : null;
      } else if (question.type === "number") {
        const num = newValue as number | null;
        urlValue = num !== null ? String(num) : null;
      } else {
        // text type
        const str = newValue as string;
        urlValue = str || null;
      }

      onChange(urlValue);
    },
    [question.type, onChange]
  );

  return (
    <div className="space-y-3">
      <Text variant="body" className="font-medium text-text">
        {question.label}
      </Text>

      {question.type === "boolean" && (
        <BooleanFilter
          question={question}
          value={parsedValue as boolean | null}
          onChange={(v) => handleChange(v)}
        />
      )}

      {question.type === "select" && (
        <SelectFilter
          question={question}
          value={parsedValue as string[]}
          onChange={(v) => handleChange(v)}
        />
      )}

      {question.type === "text" && (
        <TextFilter
          question={question}
          value={parsedValue as string}
          onChange={(v) => handleChange(v)}
        />
      )}

      {question.type === "number" && (
        <NumberFilter
          question={question}
          value={parsedValue as number | null}
          onChange={(v) => handleChange(v)}
        />
      )}
    </div>
  );
}

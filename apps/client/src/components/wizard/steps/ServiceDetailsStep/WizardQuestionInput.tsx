"use client";

import { useMemo, useCallback } from "react";
import { Text, RadioButton, Card } from "@repo/ui";
import type { QuickQuestion } from "@/hooks/category";
import {
  SelectFilter,
  TextFilter,
  NumberFilter,
} from "@/components/search/filters";

interface WizardQuestionInputProps {
  question: QuickQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  required?: boolean;
}

/**
 * WizardQuestionInput Component
 *
 * Wizard-specific question input that uses RadioButton for boolean questions
 * Other types use the standard filter components
 */
export function WizardQuestionInput({
  question,
  value,
  onChange,
  error,
  required = false,
}: WizardQuestionInputProps) {
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

    return String(value);
  }, [value, question.type]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(newValue);
    },
    [onChange]
  );

  const fieldId = `wizard-question-${question.key}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <Card className="p-4 md:p-6">
      <div
        className="space-y-3"
        role="group"
        aria-labelledby={`${fieldId}-label`}
      >
        {/* Label - centered h1 for wizard (matches Availability section) */}
        <Text
          id={`${fieldId}-label`}
          variant="h1"
          className="text-primary text-center"
        >
          {question.label}
          {required && (
            <Text
              variant="h1"
              className="text-warning inline ml-1"
              aria-label="Requerido"
              aria-hidden="true"
            >
              *
            </Text>
          )}
        </Text>

        {/* Render appropriate input component */}
        {question.type === "boolean" && (
          <div className="space-y-2">
            <RadioButton
              name={fieldId}
              value="true"
              checked={parsedValue === true}
              onChange={() => handleChange(true)}
              label="Sí"
            />
            <RadioButton
              name={fieldId}
              value="false"
              checked={parsedValue === false}
              onChange={() => handleChange(false)}
              label="No"
            />
          </div>
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

        {/* Error message */}
        {error && (
          <Text
            id={errorId}
            variant="small"
            className="text-warning text-center"
            role="alert"
            aria-live="polite"
          >
            {error}
          </Text>
        )}
      </div>
    </Card>
  );
}

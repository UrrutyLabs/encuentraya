"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface WizardState {
  proId: string | null;
  categorySlug: string | null; // Category slug for URL (user-friendly)
  subcategorySlug: string | null; // Subcategory slug for URL (user-friendly)
  date: string | null;
  time: string | null;
  address: string | null;
  hours: string | null;
  rebookFrom: string | null;
  quickQuestionAnswers: Record<string, unknown>; // Question answers keyed by question key
}

/**
 * Serialize question answers to URL-friendly format
 * Format: question_<key>=<serialized_value>
 * - boolean: "true" | "false"
 * - select: "value1,value2" (comma-separated)
 * - text: string as-is
 * - number: string representation
 */
export function serializeQuestionAnswers(
  answers: Record<string, unknown>
): Record<string, string> {
  const serialized: Record<string, string> = {};

  Object.entries(answers).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return; // Skip null/undefined values
    }

    const paramKey = `question_${key}`;

    if (typeof value === "boolean") {
      serialized[paramKey] = value ? "true" : "false";
    } else if (Array.isArray(value)) {
      // For select type (multi-select)
      serialized[paramKey] = value.join(",");
    } else if (typeof value === "number") {
      serialized[paramKey] = String(value);
    } else {
      // string type
      serialized[paramKey] = String(value);
    }
  });

  return serialized;
}

/**
 * Deserialize question answers from URL params
 * Parses question_<key>=<value> params back to typed values
 */
export function deserializeQuestionAnswers(
  params: URLSearchParams
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};

  params.forEach((value, key) => {
    if (!key.startsWith("question_")) {
      return;
    }

    const questionKey = key.replace("question_", "");

    // Try to infer type from value
    if (value === "true") {
      answers[questionKey] = true;
    } else if (value === "false") {
      answers[questionKey] = false;
    } else if (value.includes(",")) {
      // Comma-separated = select (array)
      answers[questionKey] = value.split(",").filter(Boolean);
    } else {
      // Try number first, fallback to string
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== "") {
        answers[questionKey] = numValue;
      } else {
        answers[questionKey] = value;
      }
    }
  });

  return answers;
}

export function useWizardState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: WizardState = useMemo(
    () => ({
      proId: searchParams.get("proId"),
      categorySlug: searchParams.get("category") || null, // Use "category" param name for slug
      subcategorySlug: searchParams.get("subcategory") || null,
      date: searchParams.get("date"),
      time: searchParams.get("time"),
      address: searchParams.get("address"),
      hours: searchParams.get("hours"),
      rebookFrom: searchParams.get("rebookFrom"),
      quickQuestionAnswers: deserializeQuestionAnswers(searchParams),
    }),
    [searchParams]
  );

  const updateState = useCallback(
    (updates: Partial<WizardState>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (key === "quickQuestionAnswers") {
          // Handle question answers separately
          const answers = value as Record<string, unknown> | undefined;

          // Remove all existing question params
          const keysToDelete: string[] = [];
          params.forEach((_, paramKey) => {
            if (paramKey.startsWith("question_")) {
              keysToDelete.push(paramKey);
            }
          });
          keysToDelete.forEach((keyToDelete) => {
            params.delete(keyToDelete);
          });

          // Add new question params
          if (answers && Object.keys(answers).length > 0) {
            const serialized = serializeQuestionAnswers(answers);
            Object.entries(serialized).forEach(([paramKey, paramValue]) => {
              params.set(paramKey, paramValue);
            });
          }
        } else if (value === null || value === "") {
          // Map categorySlug to "category" param name in URL
          if (key === "categorySlug") {
            params.delete("category");
          } else if (key === "subcategorySlug") {
            params.delete("subcategory");
          } else {
            params.delete(key);
          }
        } else {
          // Map categorySlug to "category" param name in URL
          if (key === "categorySlug") {
            params.set("category", String(value));
          } else if (key === "subcategorySlug") {
            params.set("subcategory", String(value));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
    },
    [searchParams, router, pathname]
  );

  const navigateToStep = useCallback(
    (step: string, additionalParams?: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Preserve existing state (including question answers)
      // Question answers are already in params from previous updates

      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value) {
            // Map categorySlug to "category" param name in URL
            if (key === "categorySlug") {
              params.set("category", value);
            } else if (key === "subcategorySlug") {
              params.set("subcategory", value);
            } else {
              params.set(key, value);
            }
          }
        });
      }

      const queryString = params.toString();
      router.push(
        `/book/wizard/${step}${queryString ? `?${queryString}` : ""}`
      );
    },
    [searchParams, router]
  );

  const clearState = useCallback(() => {
    router.push("/book");
  }, [router]);

  return {
    state,
    updateState,
    navigateToStep,
    clearState,
  };
}

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WizardStep, WizardOption } from "./types";

interface WizardState {
  currentStepIndex: number;
  answers: Record<string, unknown>;
  errors: Record<string, string>;
  visitedSteps: Set<number>;
}

type WizardAction =
  | { type: "SET_ANSWER"; optionId: string; value: unknown }
  | { type: "SET_ERROR"; optionId: string; error: string | undefined }
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; stepIndex: number }
  | { type: "INITIALIZE"; answers: Record<string, unknown> }
  | { type: "MARK_VISITED"; stepIndex: number };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_ANSWER": {
      const restErrors = Object.fromEntries(
        Object.entries(state.errors).filter(([key]) => key !== action.optionId)
      ) as Record<string, string>;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.optionId]: action.value,
        },
        errors: restErrors,
      };
    }
    case "SET_ERROR": {
      const newErrors = { ...state.errors };
      if (action.error !== undefined) {
        newErrors[action.optionId] = action.error;
      } else {
        delete newErrors[action.optionId];
      }
      return {
        ...state,
        errors: newErrors,
      };
    }
    case "GO_NEXT":
      return {
        ...state,
        currentStepIndex: state.currentStepIndex + 1,
        visitedSteps: new Set([...state.visitedSteps, state.currentStepIndex]),
      };
    case "GO_BACK":
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStepIndex: action.stepIndex,
        visitedSteps: new Set([...state.visitedSteps, action.stepIndex]),
      };
    case "INITIALIZE":
      return {
        ...state,
        answers: action.answers,
      };
    case "MARK_VISITED":
      return {
        ...state,
        visitedSteps: new Set([...state.visitedSteps, action.stepIndex]),
      };
    default:
      return state;
  }
}

interface WizardContextValue {
  // State
  currentStepIndex: number;
  currentStep: WizardStep | null;
  answers: Record<string, unknown>;
  errors: Record<string, string>;
  visitedSteps: Set<number>;
  totalSteps: number;
  visibleSteps: WizardStep[]; // Steps after filtering skipped ones

  // Navigation
  canGoNext: boolean;
  canGoBack: boolean;
  goNext: () => void;
  goBack: () => void;
  goToStep: (stepIndex: number) => void;

  // Answers
  updateAnswer: (optionId: string, value: unknown) => void;
  getAnswer: (optionId: string) => unknown;

  // Validation
  isStepValid: (stepIndex?: number) => boolean;
  validateOption: (option: WizardOption) => boolean | string;

  // Completion
  complete: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

interface WizardProviderProps {
  children: React.ReactNode;
  steps: WizardStep[];
  initialAnswers?: Record<string, unknown>;
  onComplete: (answers: Record<string, unknown>) => void;
  persistToUrl?: boolean;
  urlParamPrefix?: string;
  pathname: string;
}

export function WizardProvider({
  children,
  steps,
  initialAnswers = {},
  onComplete,
  persistToUrl = false,
  urlParamPrefix = "wizard_",
  pathname,
}: WizardProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load initial answers from URL if persistToUrl is enabled
  const loadAnswersFromUrl = useCallback(() => {
    if (!persistToUrl) return {};
    const urlAnswers: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith(urlParamPrefix)) {
        const optionId = key.replace(urlParamPrefix, "");
        // Try to parse value
        if (value === "true") {
          urlAnswers[optionId] = true;
        } else if (value === "false") {
          urlAnswers[optionId] = false;
        } else if (value.includes(",")) {
          urlAnswers[optionId] = value.split(",").filter(Boolean);
        } else {
          const numValue = Number(value);
          if (!isNaN(numValue) && value !== "") {
            urlAnswers[optionId] = numValue;
          } else {
            urlAnswers[optionId] = value;
          }
        }
      }
    });
    return urlAnswers;
  }, [persistToUrl, searchParams, urlParamPrefix]);

  // Merge initial answers with URL answers
  const mergedInitialAnswers = useMemo(() => {
    const urlAnswers = loadAnswersFromUrl();
    return { ...initialAnswers, ...urlAnswers };
  }, [initialAnswers, loadAnswersFromUrl]);

  const [state, dispatch] = useReducer(wizardReducer, {
    currentStepIndex: 0,
    answers: mergedInitialAnswers,
    errors: {},
    visitedSteps: new Set([0]),
  });

  // Filter out skipped steps
  const visibleSteps = useMemo(() => {
    return steps.filter((step) => {
      if (!step.skipIf) return true;
      // Check skip condition based on current answers
      return !step.skipIf(state.answers);
    });
  }, [steps, state.answers]);

  // Get current step (accounting for skipped steps)
  const currentStep = useMemo(() => {
    return visibleSteps[state.currentStepIndex] || null;
  }, [visibleSteps, state.currentStepIndex]);

  // Keep a ref of latest answers so persist timeouts always use current state
  // (avoids race where two updateAnswer calls each persist stale state and the second overwrites the first)
  const answersRef = useRef(state.answers);
  useEffect(() => {
    answersRef.current = state.answers;
  }, [state.answers]);

  // Persist answers to URL
  const persistAnswersToUrl = useCallback(
    (answers: Record<string, unknown>) => {
      if (!persistToUrl) return;

      const params = new URLSearchParams(searchParams.toString());

      // Remove old wizard params
      const keysToDelete: string[] = [];
      params.forEach((_, key) => {
        if (key.startsWith(urlParamPrefix)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => params.delete(key));

      // Add new answers
      Object.entries(answers).forEach(([optionId, value]) => {
        if (value === null || value === undefined) return;

        const paramKey = `${urlParamPrefix}${optionId}`;

        if (typeof value === "boolean") {
          params.set(paramKey, value ? "true" : "false");
        } else if (Array.isArray(value)) {
          params.set(paramKey, value.join(","));
        } else if (typeof value === "number") {
          params.set(paramKey, String(value));
        } else {
          params.set(paramKey, String(value));
        }
      });

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [persistToUrl, searchParams, router, pathname, urlParamPrefix]
  );

  // Validate a single option
  const validateOption = useCallback(
    (option: WizardOption): boolean | string => {
      const value = state.answers[option.id];

      // Check required
      if (option.required) {
        if (value === null || value === undefined || value === "") {
          return "Este campo es requerido";
        }
        if (Array.isArray(value) && value.length === 0) {
          return "Este campo es requerido";
        }
        if (typeof value === "number" && isNaN(value)) {
          return "Este campo es requerido";
        }
      }

      // Custom validation
      if (option.validate) {
        const validationResult = option.validate(value);
        if (validationResult !== true) {
          return validationResult;
        }
      }

      return true;
    },
    [state.answers]
  );

  // Check if current step is valid
  const isStepValid = useCallback(
    (stepIndex?: number): boolean => {
      const step =
        stepIndex !== undefined ? visibleSteps[stepIndex] : currentStep;

      if (!step) return false;

      // Check step-level validation
      if (step.validate) {
        const stepValidation = step.validate(state.answers);
        if (stepValidation !== true) {
          return false;
        }
      }

      // Check all required options are answered
      return step.options.every((option) => {
        if (!option.required) return true;
        const validation = validateOption(option);
        return validation === true;
      });
    },
    [currentStep, visibleSteps, state.answers, validateOption]
  );

  // Update answer and validate on change
  const updateAnswer = useCallback(
    (optionId: string, value: unknown) => {
      dispatch({ type: "SET_ANSWER", optionId, value });

      // Find the option to validate
      const option = currentStep?.options.find((opt) => opt.id === optionId);
      if (option) {
        const validation = validateOption(option);
        if (validation !== true) {
          dispatch({
            type: "SET_ERROR",
            optionId,
            error: typeof validation === "string" ? validation : undefined,
          });
        }
      }

      // Update URL after a short delay (debounce). Use ref so we persist
      // the latest state (avoids second updateAnswer overwriting the first in URL).
      const timeoutId = setTimeout(() => {
        persistAnswersToUrl(answersRef.current);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [currentStep, validateOption, persistAnswersToUrl]
  );

  // Get answer for an option
  const getAnswer = useCallback(
    (optionId: string): unknown => {
      return state.answers[optionId];
    },
    [state.answers]
  );

  // Navigate to next step
  const goNext = useCallback(() => {
    if (!isStepValid()) return;

    // Persist answers before moving forward
    persistAnswersToUrl(state.answers);

    // Find next non-skipped step
    let nextIndex = state.currentStepIndex + 1;
    while (
      nextIndex < visibleSteps.length &&
      visibleSteps[nextIndex].skipIf?.(state.answers)
    ) {
      nextIndex++;
    }

    if (nextIndex < visibleSteps.length) {
      dispatch({ type: "GO_NEXT" });
      dispatch({ type: "MARK_VISITED", stepIndex: nextIndex });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Last step - complete wizard
      onComplete(state.answers);
    }
  }, [
    isStepValid,
    state.answers,
    state.currentStepIndex,
    visibleSteps,
    persistAnswersToUrl,
    onComplete,
  ]);

  // Navigate to previous step
  const goBack = useCallback(() => {
    if (state.currentStepIndex === 0) return;

    // Find previous non-skipped step
    let prevIndex = state.currentStepIndex - 1;
    while (prevIndex >= 0 && visibleSteps[prevIndex].skipIf?.(state.answers)) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      dispatch({ type: "GO_BACK" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.currentStepIndex, visibleSteps, state.answers]);

  // Navigate to specific step
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= visibleSteps.length) return;
      if (visibleSteps[stepIndex].skipIf?.(state.answers)) return;

      dispatch({ type: "GO_TO_STEP", stepIndex });
      dispatch({ type: "MARK_VISITED", stepIndex });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [visibleSteps, state.answers]
  );

  // Complete wizard
  const complete = useCallback(() => {
    onComplete(state.answers);
  }, [onComplete, state.answers]);

  // Initialize answers from URL on mount
  useEffect(() => {
    const urlAnswers = loadAnswersFromUrl();
    if (Object.keys(urlAnswers).length > 0) {
      dispatch({ type: "INITIALIZE", answers: urlAnswers });
    }
  }, [loadAnswersFromUrl]);

  const value: WizardContextValue = {
    // State
    currentStepIndex: state.currentStepIndex,
    currentStep,
    answers: state.answers,
    errors: state.errors,
    visitedSteps: state.visitedSteps,
    totalSteps: visibleSteps.length,
    visibleSteps,

    // Navigation
    canGoNext: isStepValid(),
    canGoBack: state.currentStepIndex > 0,
    goNext,
    goBack,
    goToStep,

    // Answers
    updateAnswer,
    getAnswer,

    // Validation
    isStepValid,
    validateOption,

    // Completion
    complete,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizardContext(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizardContext must be used within WizardProvider");
  }
  return context;
}

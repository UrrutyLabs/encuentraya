import { ReactNode } from "react";

/**
 * Option types supported by the wizard
 */
export type WizardOptionType =
  | "radio"
  | "select"
  | "text"
  | "number"
  | "boolean"
  | "custom";

/**
 * Props passed to custom render functions
 */
export interface OptionRenderProps {
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Validation function - returns true if valid, or error message string if invalid
 */
export type ValidationFunction = (value: unknown) => boolean | string;

/**
 * Skip condition function - returns true if step should be skipped
 */
export type SkipConditionFunction = (
  answers: Record<string, unknown>
) => boolean;

/**
 * Wizard Option Configuration
 */
export interface WizardOption {
  id: string;
  type: WizardOptionType;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
  /**
   * Custom render function for the option
   * If provided, this will be used instead of the default renderer
   */
  render?: (props: OptionRenderProps) => ReactNode;
  /**
   * Custom validation function
   * Returns true if valid, or error message string if invalid
   */
  validate?: ValidationFunction;
  /**
   * Options for select/radio types
   */
  options?: string[];
  /**
   * Additional metadata for the option
   */
  metadata?: Record<string, unknown>;
}

/**
 * Wizard Step Configuration
 */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  /**
   * Options/fields in this step
   * Each option will be rendered sequentially
   */
  options: WizardOption[];
  /**
   * Skip this step if condition returns true
   */
  skipIf?: SkipConditionFunction;
  /**
   * Custom step-level validation
   */
  validate?: (answers: Record<string, unknown>) => boolean | string;
}

/**
 * Wizard Configuration Props
 */
export interface WizardProps {
  /**
   * List of steps in the wizard
   */
  steps: WizardStep[];
  /**
   * Initial answers (can be loaded from URL or previous state)
   */
  initialAnswers?: Record<string, unknown>;
  /**
   * Callback when wizard is completed
   */
  onComplete: (answers: Record<string, unknown>) => void;
  /**
   * Whether to persist answers to URL
   */
  persistToUrl?: boolean;
  /**
   * URL param prefix for persisted answers (default: "wizard_")
   */
  urlParamPrefix?: string;
  /**
   * Custom header component
   */
  header?: ReactNode;
  /**
   * Custom footer component
   */
  footer?: ReactNode;
  /**
   * Show progress indicator
   */
  showProgress?: boolean;
  /**
   * Custom className for the wizard container
   */
  className?: string;
}

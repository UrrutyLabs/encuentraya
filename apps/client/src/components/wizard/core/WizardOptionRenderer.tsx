"use client";

import { Text, RadioButton, Input } from "@repo/ui";
import type { WizardOption, OptionRenderProps } from "./types";

interface WizardOptionRendererProps {
  option: WizardOption;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

/**
 * WizardOptionRenderer Component
 *
 * Renders an option based on its type
 * Supports custom render functions via render prop
 */
export function WizardOptionRenderer({
  option,
  value,
  onChange,
  error,
}: WizardOptionRendererProps) {
  const renderProps: OptionRenderProps = {
    value,
    onChange,
    error,
    required: option.required,
    disabled: option.disabled,
  };

  // Use custom render if provided
  if (option.render) {
    return <div>{option.render(renderProps)}</div>;
  }

  // Default renderers based on type
  const fieldId = `wizard-option-${option.id}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div
      className="space-y-3"
      role="group"
      aria-labelledby={`${fieldId}-label`}
    >
      {/* Label */}
      <div className="flex items-center gap-1">
        <label
          id={`${fieldId}-label`}
          htmlFor={fieldId}
          className="text-2xl font-bold leading-8 text-primary text-center"
        >
          {option.label}
        </label>
        {option.required && (
          <Text
            variant="h1"
            className="text-warning inline ml-1"
            aria-label="Requerido"
            aria-hidden="true"
          >
            *
          </Text>
        )}
      </div>

      {/* Help text */}
      {option.helpText && (
        <Text variant="small" className="text-muted text-center">
          {option.helpText}
        </Text>
      )}

      {/* Option input based on type */}
      {option.type === "radio" && option.options && (
        <div className="space-y-2">
          {option.options.map((optValue) => (
            <RadioButton
              key={optValue}
              name={fieldId}
              value={optValue}
              checked={value === optValue}
              onChange={() => onChange(optValue)}
              label={optValue}
            />
          ))}
        </div>
      )}

      {option.type === "boolean" && (
        <div className="space-y-2">
          <RadioButton
            name={fieldId}
            value="true"
            checked={value === true}
            onChange={() => onChange(true)}
            label="Sí"
          />
          <RadioButton
            name={fieldId}
            value="false"
            checked={value === false}
            onChange={() => onChange(false)}
            label="No"
          />
        </div>
      )}

      {option.type === "select" && option.options && (
        <select
          id={fieldId}
          value={Array.isArray(value) ? value.join(",") : String(value || "")}
          onChange={(e) => {
            const selectedValues = e.target.value.split(",").filter(Boolean);
            onChange(selectedValues);
          }}
          multiple
          required={option.required}
          disabled={option.disabled}
          className="w-full px-4 py-3 md:px-3 md:py-2 border border-border rounded-lg md:rounded-md bg-surface text-text text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {option.options.map((optValue) => (
            <option key={optValue} value={optValue}>
              {optValue}
            </option>
          ))}
        </select>
      )}

      {option.type === "text" && (
        <Input
          id={fieldId}
          type="text"
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={option.placeholder}
          required={option.required}
          disabled={option.disabled}
          className="text-base md:text-sm py-3 md:py-2"
          aria-invalid={!!error}
          aria-describedby={errorId}
        />
      )}

      {option.type === "number" && (
        <Input
          id={fieldId}
          type="number"
          value={
            typeof value === "number"
              ? value
              : typeof value === "string"
                ? value
                : ""
          }
          onChange={(e) => {
            const numValue = Number(e.target.value);
            onChange(isNaN(numValue) ? null : numValue);
          }}
          placeholder={option.placeholder}
          required={option.required}
          disabled={option.disabled}
          className="text-base md:text-sm py-3 md:py-2"
          aria-invalid={!!error}
          aria-describedby={errorId}
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
  );
}

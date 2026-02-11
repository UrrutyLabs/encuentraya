import { InputHTMLAttributes, forwardRef } from "react";
import { Text } from "./Text";

interface RadioButtonProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text for the radio button */
  label: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
}

/**
 * RadioButton Component
 *
 * A styled radio button component with a label.
 * Designed to be used in radio groups for single selection.
 *
 * @example
 * ```tsx
 * <RadioButton
 *   name="availability"
 *   value="tomorrow"
 *   checked={selected === "tomorrow"}
 *   onChange={handleChange}
 *   label="Mañana"
 * />
 * ```
 */
export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ label, containerClassName = "", className = "", ...props }, ref) => {
    return (
      <label
        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border-2 border-border bg-surface text-text transition-colors touch-manipulation cursor-pointer hover:bg-surface/80 ${containerClassName}`}
      >
        <input
          ref={ref}
          type="radio"
          className={`w-4 h-4 text-primary border-border focus:ring-0 focus:outline-none cursor-pointer ${
            props.checked ? "border-primary" : "border-border"
          } ${className}`}
          {...props}
        />
        <Text variant="body" className="font-medium flex-1">
          {label}
        </Text>
      </label>
    );
  }
);

RadioButton.displayName = "RadioButton";

"use client";

import { useMemo, useCallback } from "react";
import { Calendar } from "lucide-react";
import { Text, RadioButton } from "@repo/ui";
import { Input } from "@repo/ui";

interface WizardAvailabilityFilterProps {
  selectedOption: "today" | "thisWeek" | "specificDays" | null;
  selectedDate: string;
  onOptionChange: (option: "today" | "thisWeek" | "specificDays") => void;
  onDateChange: (date: string) => void;
  minDate: string; // Today's date in YYYY-MM-DD format
}

/**
 * WizardAvailabilityFilter Component
 *
 * Availability filter for wizard step
 * Options: Today, This week, Specific days
 * Shows calendar when "Specific days" is selected
 */
export function WizardAvailabilityFilter({
  selectedOption,
  selectedDate,
  onOptionChange,
  onDateChange,
  minDate,
}: WizardAvailabilityFilterProps) {
  // Calculate tomorrow's date
  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleTodayClick = useCallback(() => {
    onOptionChange("today");
    // Set date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    onDateChange(`${year}-${month}-${day}`);
  }, [onOptionChange, onDateChange]);

  const handleThisWeekClick = useCallback(() => {
    onOptionChange("thisWeek");
    // Set date to tomorrow (start of "this week")
    onDateChange(tomorrowDate);
  }, [onOptionChange, onDateChange, tomorrowDate]);

  const handleSpecificDaysClick = useCallback(() => {
    onOptionChange("specificDays");
    // Don't set date automatically - user will choose
  }, [onOptionChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <Text variant="h1" className="text-primary text-center">
          ¿Cuándo querés que empiece?
        </Text>
      </div>

      <div className="space-y-3">
        <RadioButton
          name="wizard-availability"
          value="today"
          checked={selectedOption === "today"}
          onChange={handleTodayClick}
          label="Hoy"
        />

        <RadioButton
          name="wizard-availability"
          value="thisWeek"
          checked={selectedOption === "thisWeek"}
          onChange={handleThisWeekClick}
          label="Esta semana"
        />

        <RadioButton
          name="wizard-availability"
          value="specificDays"
          checked={selectedOption === "specificDays"}
          onChange={handleSpecificDaysClick}
          label="Días específicos"
        />
      </div>

      {/* Show calendar when "Specific days" is selected */}
      {selectedOption === "specificDays" && (
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <Calendar className="w-4 h-4 text-muted" />
            Seleccionar fecha
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate}
            required
            className="text-base md:text-sm py-3 md:py-2"
          />
        </div>
      )}
    </div>
  );
}

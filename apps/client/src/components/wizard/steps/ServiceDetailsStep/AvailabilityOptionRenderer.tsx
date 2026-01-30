"use client";

import { useMemo } from "react";
import { useWizardContext } from "../../core";
import { Card } from "@repo/ui";
import { WizardAvailabilityFilter } from "./WizardAvailabilityFilter";

interface AvailabilityOptionRendererProps {
  value: unknown;
  date: string;
  today: string;
  setDate: (date: string) => void;
  handleDateChangeWithValidation: (date: string) => void;
}

/**
 * AvailabilityOptionRenderer Component
 *
 * Wrapper component that has access to wizard context
 * Updates both availability_option and date answers.
 * When availability_option is not set, derives it from the current date so
 * "Hoy" / "Esta semana" stay selected instead of jumping to date range.
 */
export function AvailabilityOptionRenderer({
  value,
  date,
  today,
  setDate,
  handleDateChangeWithValidation,
}: AvailabilityOptionRendererProps) {
  const { answers, updateAnswer } = useWizardContext();
  const storedOption = value as "today" | "thisWeek" | "specificDays" | null;
  const currentDate = (answers.date as string) || date;

  // Tomorrow in YYYY-MM-DD for "this week" derivation
  const tomorrowStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  }, []);

  // Derive option from date when not stored, so "today"/"this week" don't jump to date range.
  // Normalize to YYYY-MM-DD for comparison (in case of timezone or format differences).
  const selectedOption = useMemo(():
    | "today"
    | "thisWeek"
    | "specificDays"
    | null => {
    if (storedOption != null) return storedOption;
    const normalized = (currentDate || "").slice(0, 10);
    if (!normalized) return null;
    if (normalized === today.slice(0, 10)) return "today";
    if (normalized === tomorrowStr) return "thisWeek";
    return "specificDays";
  }, [storedOption, currentDate, today, tomorrowStr]);

  const handleOptionChange = (
    option: "today" | "thisWeek" | "specificDays"
  ) => {
    updateAnswer("availability_option", option);

    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, "0");
    const day = String(todayDate.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    let newDate = "";
    if (option === "today") {
      newDate = todayStr;
    } else if (option === "thisWeek") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const tomorrowDay = String(tomorrow.getDate()).padStart(2, "0");
      newDate = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
    }

    if (newDate) {
      updateAnswer("date", newDate);
      setDate(newDate);
      handleDateChangeWithValidation(newDate);
    }
  };

  const handleDateChange = (newDate: string) => {
    updateAnswer("date", newDate);
    setDate(newDate);
    handleDateChangeWithValidation(newDate);
  };

  return (
    <Card className="p-4 md:p-6">
      <WizardAvailabilityFilter
        selectedOption={selectedOption}
        selectedDate={currentDate}
        onOptionChange={handleOptionChange}
        onDateChange={handleDateChange}
        minDate={today}
      />
    </Card>
  );
}

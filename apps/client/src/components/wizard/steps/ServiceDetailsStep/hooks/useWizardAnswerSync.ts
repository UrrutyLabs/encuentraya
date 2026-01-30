import { useEffect } from "react";
import { useWizardContext } from "../../../core/WizardContext";

interface UseWizardAnswerSyncProps {
  date: string;
  time: string;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  handleDateChangeWithValidation: (date: string) => void;
}

/**
 * Hook to sync wizard context answers with local date/time state
 *
 * Ensures that when wizard answers change (e.g., from URL persistence),
 * the local state is updated accordingly.
 *
 * @param props - Configuration object with state and setters
 */
export function useWizardAnswerSync({
  date,
  time,
  setDate,
  setTime,
  handleDateChangeWithValidation,
}: UseWizardAnswerSyncProps) {
  const { answers } = useWizardContext();

  // Sync wizard answers with local state for useAvailableOrderTimes
  useEffect(() => {
    if (answers.date && answers.date !== date) {
      setDate(answers.date as string);
      handleDateChangeWithValidation(answers.date as string);
    }
  }, [answers.date, date, setDate, handleDateChangeWithValidation]);

  useEffect(() => {
    if (answers.time && answers.time !== time) {
      setTime(answers.time as string);
    }
  }, [answers.time, time, setTime]);
}

import { useMemo, useEffect, useCallback } from "react";
import { TimeWindow } from "@repo/domain";

const TIME_WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Cualquier hora" },
  { value: "09:00-12:00", label: "9:00 - 12:00" },
  { value: "12:00-15:00", label: "12:00 - 15:00" },
  { value: "15:00-18:00", label: "15:00 - 18:00" },
];

/**
 * Hook to filter available time windows based on selected date
 * Filters out time windows that have already passed when date is today
 */
export function useAvailableTimeWindows(
  date: string,
  today: string,
  selectedTimeWindow: TimeWindow | "",
  setSelectedTimeWindow: (timeWindow: TimeWindow | "") => void
): {
  availableTimeWindows: { value: string; label: string }[];
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
} {
  // Filter available time windows based on selected date
  const availableTimeWindows = useMemo(() => {
    // If no date selected, show all time windows
    if (!date) {
      return TIME_WINDOW_OPTIONS;
    }

    // If future date selected, show all time windows
    if (date > today) {
      return TIME_WINDOW_OPTIONS;
    }

    // If today is selected, filter out time windows that have already passed
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      return TIME_WINDOW_OPTIONS.filter((option) => {
        // Always include the "Cualquier hora" option
        if (option.value === "") {
          return true;
        }

        // Extract start time from window (e.g., "09:00-12:00" -> "09:00")
        const [windowStart] = option.value.split("-");
        const [windowHour, windowMinute] = windowStart.split(":").map(Number);
        const windowStartInMinutes = windowHour * 60 + windowMinute;

        // Only include if window start time hasn't passed yet
        return currentTimeInMinutes < windowStartInMinutes;
      });
    }

    // Fallback: show all time windows
    return TIME_WINDOW_OPTIONS;
  }, [date, today]);

  // Clear timeWindow if it becomes invalid (not in available list)
  useEffect(() => {
    if (selectedTimeWindow) {
      const isAvailable = availableTimeWindows.some(
        (option) => option.value === selectedTimeWindow
      );
      if (!isAvailable) {
        setSelectedTimeWindow("");
      }
    }
  }, [selectedTimeWindow, availableTimeWindows, setSelectedTimeWindow]);

  // Clear timeWindow if it becomes invalid when date changes
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      // Note: This hook doesn't manage the date state, just validates
      // The parent component should call setDate(newDate) separately

      // If a time window is selected, check if it's still valid
      if (selectedTimeWindow) {
        // If date is today, check if the time window has passed
        if (newDate === today) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;

          const [windowStart] = selectedTimeWindow.split("-");
          const [windowHour, windowMinute] = windowStart.split(":").map(Number);
          const windowStartInMinutes = windowHour * 60 + windowMinute;

          // Clear time window if it has already passed
          if (currentTimeInMinutes >= windowStartInMinutes) {
            setSelectedTimeWindow("");
          }
        }
      }
    },
    [selectedTimeWindow, today, setSelectedTimeWindow]
  );

  return {
    availableTimeWindows,
    handleDateChange,
  };
}

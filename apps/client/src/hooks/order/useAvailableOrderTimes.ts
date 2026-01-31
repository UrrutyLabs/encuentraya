import { useMemo, useEffect, useCallback } from "react";
import type { AvailabilitySlot } from "@repo/domain";

interface TimeOption {
  value: string;
  label: string;
}

interface UseAvailableOrderTimesOptions {
  minBufferMinutes?: number; // Minimum time buffer in minutes (default: 60)
  startHour?: number; // Start hour (default: 9)
  endHour?: number; // End hour (default: 18)
  availabilitySlots?: AvailabilitySlot[]; // Pro's availability slots to filter times
}

/**
 * Hook to generate and filter available order times
 * Generates times at hour and half-hour intervals
 * Filters out times that are too soon when date is today
 */
export function useAvailableOrderTimes(
  date: string,
  today: string,
  selectedTime: string,
  setSelectedTime: (time: string) => void,
  options: UseAvailableOrderTimesOptions = {}
): {
  availableTimes: TimeOption[];
  handleDateChange: (newDate: string) => void;
} {
  const {
    minBufferMinutes = 60,
    startHour = 9,
    endHour = 18,
    availabilitySlots = [],
  } = options;

  // Generate available time options (hour and half-hour intervals)
  const availableTimes = useMemo(() => {
    const times: TimeOption[] = [];

    // Generate times from startHour to endHour at hour and half-hour intervals
    for (let hour = startHour; hour <= endHour; hour++) {
      // Add hour time (e.g., 09:00, 10:00)
      times.push({
        value: `${String(hour).padStart(2, "0")}:00`,
        label: `${hour}:00`,
      });

      // Add half-hour time (e.g., 09:30, 10:30), but not for endHour (last hour)
      if (hour < endHour) {
        times.push({
          value: `${String(hour).padStart(2, "0")}:30`,
          label: `${hour}:30`,
        });
      }
    }

    // Filter by pro's availability slots if provided
    let filteredTimes = times;
    if (availabilitySlots.length > 0 && date) {
      const selectedDate = new Date(date + "T00:00:00"); // Parse as local date to get correct day
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Get availability slots for the selected day
      const daySlots = availabilitySlots.filter(
        (slot) => slot.dayOfWeek === dayOfWeek
      );

      if (daySlots.length > 0) {
        // Filter times to only include those within pro's availability windows
        filteredTimes = times.filter((timeOption) => {
          return daySlots.some((slot) => {
            // Check if time falls within the slot's time range
            // Time format is "HH:MM" (e.g., "09:00", "13:30")
            return (
              timeOption.value >= slot.startTime &&
              timeOption.value < slot.endTime
            );
          });
        });
      }
      // If no availability slots for this day, keep all times (fallback)
      // This allows users to select times even if pro hasn't set availability for that day
    }

    // If date is today, filter out times that are less than minBufferMinutes from now
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Minimum time is minBufferMinutes from now
      const minTimeInMinutes = currentTimeInMinutes + minBufferMinutes;

      return filteredTimes.filter((timeOption) => {
        const [timeHour, timeMinute] = timeOption.value.split(":").map(Number);
        const timeInMinutes = timeHour * 60 + timeMinute;
        return timeInMinutes >= minTimeInMinutes;
      });
    }

    return filteredTimes;
  }, [date, today, minBufferMinutes, startHour, endHour, availabilitySlots]);

  // Handle date change with validation
  const handleDateChange = useCallback(
    (newDate: string) => {
      // If date is today and a time is selected, check if it's still valid
      if (newDate === today && selectedTime) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const minTimeInMinutes = currentTimeInMinutes + minBufferMinutes;

        const [timeHour, timeMinute] = selectedTime.split(":").map(Number);
        const selectedTimeInMinutes = timeHour * 60 + timeMinute;

        // Clear time if it's less than minBufferMinutes away
        if (selectedTimeInMinutes < minTimeInMinutes) {
          setSelectedTime("");
        }
      }
    },
    [today, selectedTime, setSelectedTime, minBufferMinutes]
  );

  // Clear time if it becomes invalid when date is today and time passes
  useEffect(() => {
    if (date === today && selectedTime) {
      const isAvailable = availableTimes.some(
        (option) => option.value === selectedTime
      );
      if (!isAvailable) {
        setSelectedTime("");
      }
    }
  }, [date, today, selectedTime, availableTimes, setSelectedTime]);

  return {
    availableTimes,
    handleDateChange,
  };
}

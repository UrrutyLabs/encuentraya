import { useState, useEffect, useRef } from "react";
import { useTodayDate } from "@/hooks/shared";
import { useAvailableOrderTimes } from "@/hooks/order";
import type { AvailabilitySlot } from "@repo/domain";

interface UseServiceDetailsDateTimeSyncProps {
  initialDate?: string | null;
  initialTime?: string | null;
  categoryId: string | "";
  proAvailabilitySlots?: AvailabilitySlot[];
  onCategoryChange?: () => void;
}

interface UseServiceDetailsDateTimeSyncReturn {
  date: string;
  time: string;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  availableTimes: Array<{ value: string; label: string }>;
  handleDateChangeWithValidation: (date: string) => void;
}

/**
 * Hook to manage date/time state and synchronization
 *
 * Handles:
 * - Local date/time state initialization
 * - Syncing with useAvailableOrderTimes
 * - Resetting date/time when category changes
 * - Date change validation
 *
 * @param props - Configuration object
 * @returns Date/time state, setters, and available times
 */
export function useServiceDetailsDateTimeSync({
  initialDate,
  initialTime,
  categoryId,
  proAvailabilitySlots,
  onCategoryChange,
}: UseServiceDetailsDateTimeSyncProps): UseServiceDetailsDateTimeSyncReturn {
  const today = useTodayDate();

  // Local state for date/time
  const [date, setDateState] = useState(initialDate || "");
  const [time, setTimeState] = useState(initialTime || "");

  // Track previous categoryId to reset date/time when category changes
  const prevCategoryIdRef = useRef(categoryId);

  // Reset date/time when category changes (but not on initial load)
  useEffect(() => {
    if (
      prevCategoryIdRef.current &&
      prevCategoryIdRef.current !== categoryId &&
      categoryId &&
      prevCategoryIdRef.current !== ""
    ) {
      // Category changed (and wasn't empty), reset answers
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setDateState("");
        setTimeState("");
        onCategoryChange?.();
      }, 0);
    }
    prevCategoryIdRef.current = categoryId;
  }, [categoryId, onCategoryChange]);

  // Get available times based on date and pro availability
  const { availableTimes, handleDateChange: handleDateChangeWithValidation } =
    useAvailableOrderTimes(date, today, time, setTimeState, {
      minBufferMinutes: 60,
      startHour: 9,
      endHour: 18,
      availabilitySlots: proAvailabilitySlots,
    });

  // Wrapper for setDate that also triggers validation
  const setDate = (newDate: string) => {
    setDateState(newDate);
    handleDateChangeWithValidation(newDate);
  };

  return {
    date,
    time,
    setDate,
    setTime: setTimeState,
    availableTimes,
    handleDateChangeWithValidation,
  };
}

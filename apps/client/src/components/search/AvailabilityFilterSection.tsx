"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Text, RadioButton } from "@repo/ui";

/**
 * AvailabilityFilterSection Component
 *
 * Static filter section for "Cuando queres que empiece?"
 * Options: Mañana (Tomorrow), Esta semana (This week), Cuando sea (Whenever)
 */
export function AvailabilityFilterSection() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentDate = searchParams.get("date") || "";
  const availabilityParam = searchParams.get("availability");

  // Calculate tomorrow's date
  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Calculate end of week date (7 days from today)
  const endOfWeekDate = useMemo(() => {
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const year = endOfWeek.getFullYear();
    const month = String(endOfWeek.getMonth() + 1).padStart(2, "0");
    const day = String(endOfWeek.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Determine which option is selected
  const selectedOption = useMemo(() => {
    if (!currentDate) return "whenever";

    // If availability param is set to "thisWeek", use it
    if (availabilityParam === "thisWeek") {
      return "thisWeek";
    }

    const currentDateObj = new Date(currentDate);
    const tomorrowDateObj = new Date(tomorrowDate);
    const endOfWeekDateObj = new Date(endOfWeekDate);

    // Normalize dates to compare only dates (ignore time)
    const normalizeDate = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const normalizedCurrent = normalizeDate(currentDateObj);
    const normalizedTomorrow = normalizeDate(tomorrowDateObj);
    const normalizedEndOfWeek = normalizeDate(endOfWeekDateObj);

    // Check if it's exactly tomorrow
    if (normalizedCurrent.getTime() === normalizedTomorrow.getTime()) {
      return "tomorrow";
    }

    // Check if it's within this week (after tomorrow, up to end of week)
    if (
      normalizedCurrent > normalizedTomorrow &&
      normalizedCurrent <= normalizedEndOfWeek
    ) {
      return "thisWeek";
    }

    // Otherwise, it's a custom date (not one of our quick options)
    return "custom";
  }, [currentDate, tomorrowDate, endOfWeekDate, availabilityParam]);

  const handleOptionChange = useCallback(
    (option: "tomorrow" | "thisWeek" | "whenever") => {
      const params = new URLSearchParams(searchParams.toString());

      if (option === "tomorrow") {
        params.set("date", tomorrowDate);
        // Remove availability param to use exact date matching
        params.delete("availability");
      } else if (option === "thisWeek") {
        // Set to tomorrow as the start of "this week"
        // Store availability param to distinguish from "tomorrow"
        params.set("date", tomorrowDate);
        params.set("availability", "thisWeek");
      } else {
        // "whenever" - remove date filter
        params.delete("date");
        params.delete("availability");
        params.delete("timeWindow"); // Also remove timeWindow when removing date
      }

      const queryString = params.toString();
      router.push(`/search/results${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [searchParams, router, tomorrowDate]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <Text variant="body" className="font-medium text-text">
          ¿Cuándo querés que empiece?
        </Text>
      </div>

      <div className="space-y-2">
        <RadioButton
          name="availability"
          value="tomorrow"
          checked={selectedOption === "tomorrow"}
          onChange={() => handleOptionChange("tomorrow")}
          label="Mañana"
        />

        <RadioButton
          name="availability"
          value="thisWeek"
          checked={selectedOption === "thisWeek"}
          onChange={() => handleOptionChange("thisWeek")}
          label="Esta semana"
        />

        <RadioButton
          name="availability"
          value="whenever"
          checked={selectedOption === "whenever"}
          onChange={() => handleOptionChange("whenever")}
          label="Cuando sea"
        />
      </div>
    </div>
  );
}

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAvailableOrderTimes } from "../useAvailableOrderTimes";
import type { AvailabilitySlot } from "@repo/domain";

describe("useAvailableOrderTimes", () => {
  let mockSetSelectedTime: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSelectedTime = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("time generation", () => {
    it("should generate times at hour and half-hour intervals", () => {
      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime
        )
      );

      const times = result.current.availableTimes;
      expect(times.length).toBeGreaterThan(0);

      // Check first few times
      expect(times[0].value).toBe("09:00");
      expect(times[0].label).toBe("9:00");
      expect(times[1].value).toBe("09:30");
      expect(times[1].label).toBe("9:30");
      expect(times[2].value).toBe("10:00");
      expect(times[2].label).toBe("10:00");
    });

    it("should use default startHour (9) and endHour (18)", () => {
      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime
        )
      );

      const times = result.current.availableTimes;
      expect(times[0].value).toBe("09:00");
      const lastTime = times[times.length - 1];
      expect(lastTime.value).toBe("18:00");
    });

    it("should not include half-hour for the last hour", () => {
      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime
        )
      );

      const times = result.current.availableTimes;
      const lastTime = times[times.length - 1];
      expect(lastTime.value).toBe("18:00");
      expect(times[times.length - 2].value).toBe("17:30");
    });

    it("should respect custom startHour and endHour", () => {
      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { startHour: 10, endHour: 16 }
        )
      );

      const times = result.current.availableTimes;
      expect(times[0].value).toBe("10:00");
      const lastTime = times[times.length - 1];
      expect(lastTime.value).toBe("16:00");
    });
  });

  describe("filtering by availability slots", () => {
    it("should filter times based on pro availability slots", () => {
      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "12:00",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-15", // This is a Monday
          "2024-01-10",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      const times = result.current.availableTimes;
      // Should only include times between 09:00 and 12:00
      expect(times.every((t) => t.value >= "09:00" && t.value < "12:00")).toBe(
        true
      );
    });

    it("should return empty array when no availability for selected day", () => {
      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "12:00",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-14", // This is a Sunday
          "2024-01-10",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      const times = result.current.availableTimes;
      expect(times).toEqual([]);
    });
  });

  describe("filtering times that are too soon", () => {
    it("should filter out times less than minBufferMinutes from now when date is today", () => {
      vi.useFakeTimers();
      const now = new Date("2024-01-15T10:00:00");
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-15", // Today
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      const times = result.current.availableTimes;
      // Should not include times before 11:00 (10:00 + 60 minutes)
      expect(times.every((t) => t.value >= "11:00")).toBe(true);
    });
  });

  describe("handleDateChange", () => {
    it("should clear selected time if it becomes invalid when date changes to today", () => {
      vi.useFakeTimers();
      const now = new Date("2024-01-15T10:00:00");
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableOrderTimes(
          "2024-01-20",
          "2024-01-15",
          "09:00", // Selected time that will be invalid
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      act(() => {
        result.current.handleDateChange("2024-01-15"); // Change to today
      });

      // Should clear the selected time since 09:00 is less than 60 minutes from now (10:00)
      expect(mockSetSelectedTime).toHaveBeenCalledWith("");
    });
  });
});

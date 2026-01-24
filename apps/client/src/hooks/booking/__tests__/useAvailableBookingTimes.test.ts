import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAvailableBookingTimes } from "../useAvailableBookingTimes";
import type { AvailabilitySlot } from "@repo/domain";

describe("useAvailableBookingTimes", () => {
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
        useAvailableBookingTimes(
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
        useAvailableBookingTimes(
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
        useAvailableBookingTimes(
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
        useAvailableBookingTimes(
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
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 8, 0, 0); // Local time: Jan 15, 2024 08:00 (before slot starts)
      vi.setSystemTime(now);

      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "10:00",
          endTime: "14:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Set date to Monday (2024-01-15 is a Monday)
      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      const times = result.current.availableTimes;

      // Should only include times between 10:00 and 14:00
      expect(times.some((t) => t.value === "09:00")).toBe(false);
      expect(times.some((t) => t.value === "10:00")).toBe(true);
      expect(times.some((t) => t.value === "13:30")).toBe(true);
      expect(times.some((t) => t.value === "14:00")).toBe(false);
    });

    it("should return empty array if no availability for selected day", () => {
      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "10:00",
          endTime: "14:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Set date to Tuesday (2024-01-16 is a Tuesday)
      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-16",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      expect(result.current.availableTimes).toHaveLength(0);
    });

    it("should include times that match slot boundaries", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 8, 0, 0); // Local time: Jan 15, 2024 08:00 (before slot starts)
      vi.setSystemTime(now);

      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "12:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      const times = result.current.availableTimes;
      expect(times.some((t) => t.value === "09:00")).toBe(true);
      expect(times.some((t) => t.value === "11:30")).toBe(true);
      expect(times.some((t) => t.value === "12:00")).toBe(false); // endTime is exclusive
    });

    it("should handle multiple availability slots for same day", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 8, 0, 0); // Local time: Jan 15, 2024 08:00 (before slots start)
      vi.setSystemTime(now);

      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "12:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "slot-2",
          dayOfWeek: 1,
          startTime: "14:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots }
        )
      );

      const times = result.current.availableTimes;
      expect(times.some((t) => t.value === "10:00")).toBe(true);
      expect(times.some((t) => t.value === "13:00")).toBe(false); // Gap between slots
      expect(times.some((t) => t.value === "15:00")).toBe(true);
    });

    it("should show all times if no availability slots provided", () => {
      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots: [] }
        )
      );

      const times = result.current.availableTimes;
      expect(times.length).toBeGreaterThan(0);
    });
  });

  describe("filtering by time buffer for today", () => {
    it("should filter out times less than minBufferMinutes from now when date is today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 30, 0); // Local time: Jan 15, 2024 10:30
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      const times = result.current.availableTimes;
      // Current time is 10:30, minBuffer is 60 minutes
      // So minimum time should be 11:30
      expect(times.some((t) => t.value === "10:00")).toBe(false);
      expect(times.some((t) => t.value === "11:00")).toBe(false);
      expect(times.some((t) => t.value === "11:30")).toBe(true);
      expect(times.some((t) => t.value === "12:00")).toBe(true);
    });

    it("should respect custom minBufferMinutes", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 90 }
        )
      );

      const times = result.current.availableTimes;
      // Current time is 10:00, minBuffer is 90 minutes
      // So minimum time should be 11:30
      expect(times.some((t) => t.value === "11:00")).toBe(false);
      expect(times.some((t) => t.value === "11:30")).toBe(true);
    });

    it("should not filter times for future dates", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 30, 0); // Local time: Jan 15, 2024 10:30
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      const times = result.current.availableTimes;
      // Should include all times since it's a future date
      expect(times.some((t) => t.value === "09:00")).toBe(true);
      expect(times.some((t) => t.value === "10:00")).toBe(true);
    });
  });

  describe("handleDateChange", () => {
    it("should clear time if it's less than minBufferMinutes away when changing to today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 13, 0, 0); // Local time: Jan 15, 2024 13:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-20",
          "2024-01-15",
          "12:00",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      act(() => {
        result.current.handleDateChange("2024-01-15");
      });

      // Should clear because 12:00 is less than 60 minutes from 13:00
      expect(mockSetSelectedTime).toHaveBeenCalledWith("");
    });

    it("should not clear time if it's still valid when changing to today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-20",
          "2024-01-15",
          "12:00",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      act(() => {
        result.current.handleDateChange("2024-01-15");
      });

      // Should not clear because 12:00 is more than 60 minutes from 10:00
      expect(mockSetSelectedTime).not.toHaveBeenCalled();
    });

    it("should not clear time when changing to future date", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "12:00",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      act(() => {
        result.current.handleDateChange("2024-01-20");
      });

      expect(mockSetSelectedTime).not.toHaveBeenCalled();
    });

    it("should not clear if no time is selected", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      act(() => {
        result.current.handleDateChange("2024-01-15");
      });

      expect(mockSetSelectedTime).not.toHaveBeenCalled();
    });
  });

  describe("useEffect - clearing invalid time", () => {
    it("should clear time if it's not in available times when date is today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 13, 0, 0); // Local time: Jan 15, 2024 13:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "10:00",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      // Should clear because 10:00 is not in available times (less than 60 min from now)
      expect(mockSetSelectedTime).toHaveBeenCalledWith("");
    });

    it("should not clear time if it's still available", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "12:00",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      // Should not clear because 12:00 is still available
      expect(mockSetSelectedTime).not.toHaveBeenCalled();
    });

    it("should not clear if no time is selected", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { minBufferMinutes: 60 }
        )
      );

      expect(mockSetSelectedTime).not.toHaveBeenCalled();
    });
  });

  describe("combined filtering", () => {
    it("should apply both availability slots and time buffer filters", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const availabilitySlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "14:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { result } = renderHook(() =>
        useAvailableBookingTimes(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTime,
          { availabilitySlots, minBufferMinutes: 60 }
        )
      );

      const times = result.current.availableTimes;

      // Should exclude 09:00 and 09:30 (less than 60 min from 10:00)
      // Should include 11:00 onwards (within availability slot and >= 60 min from now)
      expect(times.some((t) => t.value === "09:00")).toBe(false);
      expect(times.some((t) => t.value === "09:30")).toBe(false);
      expect(times.some((t) => t.value === "11:00")).toBe(true);
      expect(times.some((t) => t.value === "13:30")).toBe(true);
      expect(times.some((t) => t.value === "14:00")).toBe(false); // endTime is exclusive
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAvailableTimeWindows } from "../useAvailableTimeWindows";
import { TimeWindow } from "@repo/domain";

describe("useAvailableTimeWindows", () => {
  let mockSetSelectedTimeWindow: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSelectedTimeWindow = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when no date is selected", () => {
    it("should return all time windows", () => {
      const { result } = renderHook(() =>
        useAvailableTimeWindows("", "2024-01-15", "", mockSetSelectedTimeWindow)
      );

      expect(result.current.availableTimeWindows).toHaveLength(4);
      expect(result.current.availableTimeWindows[0].value).toBe("");
      expect(result.current.availableTimeWindows[0].label).toBe(
        "Cualquier hora"
      );
      expect(result.current.availableTimeWindows[1].value).toBe("09:00-12:00");
      expect(result.current.availableTimeWindows[2].value).toBe("12:00-15:00");
      expect(result.current.availableTimeWindows[3].value).toBe("15:00-18:00");
    });
  });

  describe("when future date is selected", () => {
    it("should return all time windows", () => {
      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      expect(result.current.availableTimeWindows).toHaveLength(4);
    });
  });

  describe("when today is selected", () => {
    it("should filter out time windows that have already passed", () => {
      // Set current time to 10:30 (between 09:00-12:00 and 12:00-15:00)
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 30, 0); // Local time: Jan 15, 2024 10:30
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      // Should include "Cualquier hora", "12:00-15:00", and "15:00-18:00"
      // Should exclude "09:00-12:00" (already started)
      expect(result.current.availableTimeWindows).toHaveLength(3);
      expect(result.current.availableTimeWindows[0].value).toBe("");
      expect(result.current.availableTimeWindows[1].value).toBe("12:00-15:00");
      expect(result.current.availableTimeWindows[2].value).toBe("15:00-18:00");
    });

    it("should always include 'Cualquier hora' option", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 20, 0, 0); // Local time: Jan 15, 2024 20:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      expect(result.current.availableTimeWindows).toHaveLength(1);
      expect(result.current.availableTimeWindows[0].value).toBe("");
      expect(result.current.availableTimeWindows[0].label).toBe(
        "Cualquier hora"
      );
    });

    it("should filter out all specific windows if they have passed", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 18, 30, 0); // Local time: Jan 15, 2024 18:30
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      expect(result.current.availableTimeWindows).toHaveLength(1);
      expect(result.current.availableTimeWindows[0].value).toBe("");
    });

    it("should exclude windows that start exactly at current time", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 12, 0, 0); // Local time: Jan 15, 2024 12:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      // The logic uses `<` so windows starting exactly at current time are excluded
      // Should exclude "12:00-15:00" (current time >= window start)
      // Should include "15:00-18:00"
      expect(result.current.availableTimeWindows).toHaveLength(2);
      expect(result.current.availableTimeWindows[0].value).toBe("");
      expect(result.current.availableTimeWindows[1].value).toBe("15:00-18:00");
    });
  });

  describe("handleDateChange", () => {
    it("should clear time window if it has passed when changing to today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 13, 0, 0); // Local time: Jan 15, 2024 13:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-20",
          "2024-01-15",
          "09:00-12:00" as TimeWindow,
          mockSetSelectedTimeWindow
        )
      );

      act(() => {
        result.current.handleDateChange({
          target: { value: "2024-01-15" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Should clear because "09:00-12:00" has passed (current time is 13:00)
      expect(mockSetSelectedTimeWindow).toHaveBeenCalledWith("");
    });

    it("should not clear time window if it hasn't passed when changing to today", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-20",
          "2024-01-15",
          "12:00-15:00" as TimeWindow,
          mockSetSelectedTimeWindow
        )
      );

      act(() => {
        result.current.handleDateChange({
          target: { value: "2024-01-15" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Should not clear because "12:00-15:00" hasn't passed yet
      expect(mockSetSelectedTimeWindow).not.toHaveBeenCalled();
    });

    it("should not clear time window when changing to future date", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 8, 0, 0); // Local time: Jan 15, 2024 08:00 (before all windows)
      vi.setSystemTime(now);

      // Start with a valid time window for today
      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "09:00-12:00" as TimeWindow,
          mockSetSelectedTimeWindow
        )
      );

      // Clear any calls from initial render
      mockSetSelectedTimeWindow.mockClear();

      act(() => {
        result.current.handleDateChange({
          target: { value: "2024-01-20" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Should not clear when changing to future date
      expect(mockSetSelectedTimeWindow).not.toHaveBeenCalled();
    });

    it("should not clear if no time window is selected", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      const { result } = renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-20",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      act(() => {
        result.current.handleDateChange({
          target: { value: "2024-01-15" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(mockSetSelectedTimeWindow).not.toHaveBeenCalled();
    });
  });

  describe("useEffect - clearing invalid time window", () => {
    it("should clear time window if it's not in available list", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 13, 0, 0); // Local time: Jan 15, 2024 13:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "09:00-12:00" as TimeWindow,
          mockSetSelectedTimeWindow
        )
      );

      // Should clear because "09:00-12:00" is not in available windows
      expect(mockSetSelectedTimeWindow).toHaveBeenCalledWith("");
    });

    it("should not clear time window if it's still available", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "12:00-15:00" as TimeWindow,
          mockSetSelectedTimeWindow
        )
      );

      // Should not clear because "12:00-15:00" is still available
      expect(mockSetSelectedTimeWindow).not.toHaveBeenCalled();
    });

    it("should not clear if no time window is selected", () => {
      vi.useFakeTimers();
      const now = new Date(2024, 0, 15, 10, 0, 0); // Local time: Jan 15, 2024 10:00
      vi.setSystemTime(now);

      renderHook(() =>
        useAvailableTimeWindows(
          "2024-01-15",
          "2024-01-15",
          "",
          mockSetSelectedTimeWindow
        )
      );

      expect(mockSetSelectedTimeWindow).not.toHaveBeenCalled();
    });
  });
});

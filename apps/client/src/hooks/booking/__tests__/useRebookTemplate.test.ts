import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRebookTemplate } from "../useRebookTemplate";
import { mockTrpcBookingRebookTemplate } from "@/test-setup";
import { Category } from "@repo/domain";

describe("useRebookTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when bookingId is provided", () => {
    it("should fetch rebook template", () => {
      const mockTemplate = {
        proId: "pro-1",
        category: Category.PLUMBING,
        description: "Fix leak",
        estimatedHours: 2,
      };

      mockTrpcBookingRebookTemplate.mockReturnValue({
        data: mockTemplate,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRebookTemplate("booking-1"));

      expect(mockTrpcBookingRebookTemplate).toHaveBeenCalledWith(
        { bookingId: "booking-1" },
        {
          enabled: true,
          retry: false,
        }
      );

      expect(result.current.data).toEqual(mockTemplate);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should return loading state when data is loading", () => {
      mockTrpcBookingRebookTemplate.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useRebookTemplate("booking-1"));

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch template");

      mockTrpcBookingRebookTemplate.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useRebookTemplate("booking-1"));

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("when bookingId is undefined", () => {
    it("should disable query", () => {
      mockTrpcBookingRebookTemplate.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRebookTemplate(undefined));

      expect(mockTrpcBookingRebookTemplate).toHaveBeenCalledWith(
        { bookingId: undefined },
        {
          enabled: false,
          retry: false,
        }
      );
    });
  });

  describe("query configuration", () => {
    it("should set retry to false", () => {
      mockTrpcBookingRebookTemplate.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRebookTemplate("booking-1"));

      expect(mockTrpcBookingRebookTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          retry: false,
        })
      );
    });
  });
});

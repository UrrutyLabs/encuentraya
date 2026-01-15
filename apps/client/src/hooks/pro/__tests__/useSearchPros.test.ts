import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { Category } from "@repo/domain";
import { useSearchPros } from "../useSearchPros";
import { mockTrpcClientSearchPros } from "@/test-setup";

describe("useSearchPros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when filters are provided", () => {
    it("should fetch pros with category filter", () => {
      const mockPros = [
        {
          id: "pro-1",
          name: "John Doe",
          hourlyRate: 50,
          categories: [Category.PLUMBING],
        },
        {
          id: "pro-2",
          name: "Jane Smith",
          hourlyRate: 60,
          categories: [Category.PLUMBING],
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useSearchPros({ category: Category.PLUMBING })
      );

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          category: Category.PLUMBING,
          date: undefined,
          time: undefined,
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should fetch pros with date filter", () => {
      const mockPros = [
        {
          id: "pro-1",
          name: "John Doe",
          hourlyRate: 50,
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const date = "2024-01-15";
      const { result } = renderHook(() => useSearchPros({ date }));

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          category: undefined,
          date: new Date(date),
          time: undefined,
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
    });

    it("should fetch pros with time filter", () => {
      const mockPros = [
        {
          id: "pro-1",
          name: "John Doe",
          hourlyRate: 50,
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const time = "14:00";
      const { result } = renderHook(() => useSearchPros({ time }));

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          category: undefined,
          date: undefined,
          time: "14:00",
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
    });

    it("should fetch pros with all filters", () => {
      const mockPros = [
        {
          id: "pro-1",
          name: "John Doe",
          hourlyRate: 50,
          categories: [Category.PLUMBING],
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const date = "2024-01-15";
      const time = "14:00";
      const { result } = renderHook(() =>
        useSearchPros({
          category: Category.PLUMBING,
          date,
          time,
        })
      );

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          category: Category.PLUMBING,
          date: new Date(date),
          time: "14:00",
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
    });
  });

  describe("when no filters are provided", () => {
    it("should fetch all pros with empty filters", () => {
      const mockPros = [
        {
          id: "pro-1",
          name: "John Doe",
          hourlyRate: 50,
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useSearchPros({}));

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          category: undefined,
          date: undefined,
          time: undefined,
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
    });
  });

  describe("loading and error states", () => {
    it("should return loading state when data is loading", () => {
      mockTrpcClientSearchPros.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useSearchPros({}));

      expect(result.current.pros).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch pros");

      mockTrpcClientSearchPros.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useSearchPros({}));

      expect(result.current.pros).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });

    it("should return empty array when data is undefined", () => {
      mockTrpcClientSearchPros.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useSearchPros({}));

      expect(result.current.pros).toEqual([]);
    });
  });

  describe("query configuration", () => {
    it("should set refetchOnWindowFocus to false", () => {
      mockTrpcClientSearchPros.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderHook(() => useSearchPros({}));

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          refetchOnWindowFocus: false,
        })
      );
    });
  });

  describe("date conversion", () => {
    it("should convert date string to Date object", () => {
      mockTrpcClientSearchPros.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const date = "2024-01-15";
      renderHook(() => useSearchPros({ date }));

      const callArgs = mockTrpcClientSearchPros.mock.calls[0][0];
      expect(callArgs.date).toBeInstanceOf(Date);
      expect(callArgs.date.toISOString()).toContain("2024-01-15");
    });

    it("should not convert date when date is undefined", () => {
      mockTrpcClientSearchPros.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderHook(() => useSearchPros({}));

      const callArgs = mockTrpcClientSearchPros.mock.calls[0][0];
      expect(callArgs.date).toBeUndefined();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
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
          categoryIds: ["cat-plumbing"],
        },
        {
          id: "pro-2",
          name: "Jane Smith",
          hourlyRate: 60,
          categoryIds: ["cat-plumbing"],
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useSearchPros({ categoryId: "cat-plumbing" })
      );

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          categoryId: "cat-plumbing",
          date: undefined,
          timeWindow: undefined,
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
          categoryId: undefined,
          date: new Date(date),
          timeWindow: undefined,
        },
        {
          refetchOnWindowFocus: false,
        }
      );

      expect(result.current.pros).toEqual(mockPros);
    });

    it("should fetch pros with timeWindow filter", () => {
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

      const timeWindow = "12:00-15:00";
      const { result } = renderHook(() => useSearchPros({ timeWindow }));

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          categoryId: undefined,
          date: undefined,
          timeWindow: "12:00-15:00",
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
          categoryIds: ["cat-plumbing"],
        },
      ];

      mockTrpcClientSearchPros.mockReturnValue({
        data: mockPros,
        isLoading: false,
        error: null,
      });

      const date = "2024-01-15";
      const timeWindow = "12:00-15:00";
      const { result } = renderHook(() =>
        useSearchPros({
          categoryId: "cat-plumbing",
          date,
          timeWindow,
        })
      );

      expect(mockTrpcClientSearchPros).toHaveBeenCalledWith(
        {
          categoryId: "cat-plumbing",
          date: new Date(date),
          timeWindow: "12:00-15:00",
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
          categoryId: undefined,
          date: undefined,
          timeWindow: undefined,
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

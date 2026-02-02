import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProDetail } from "../useProDetail";
import { mockTrpcProGetById } from "@/test-setup";

describe("useProDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when proId is provided", () => {
    it("should fetch pro details when proId is defined", () => {
      const mockPro = {
        id: "pro-1",
        name: "John Doe",
        email: "john@example.com",
        hourlyRate: 50,
        isApproved: true,
        isSuspended: false,
      };

      mockTrpcProGetById.mockReturnValue({
        data: mockPro,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useProDetail("pro-1"));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.objectContaining({ id: "pro-1" }),
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.pro).toEqual(mockPro);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should return loading state when data is loading", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useProDetail("pro-1"));

      expect(result.current.pro).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch pro");

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useProDetail("pro-1"));

      expect(result.current.pro).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("when proId is undefined", () => {
    it("should disable query when proId is undefined", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useProDetail(undefined));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.objectContaining({ id: undefined }),
        expect.objectContaining({
          enabled: false,
          retry: false,
        })
      );
    });

    it("should disable query when proId is empty string", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useProDetail(""));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.objectContaining({ id: "" }),
        expect.objectContaining({
          enabled: false,
          retry: false,
        })
      );
    });

    it("should pass categoryId to query when provided", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useProDetail("pro-1", "cat-plumbing"));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.objectContaining({ id: "pro-1", categoryId: "cat-plumbing" }),
        expect.any(Object)
      );
    });
  });

  describe("query configuration", () => {
    it("should set retry to false", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useProDetail("pro-1"));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          retry: false,
        })
      );
    });

    it("should enable query only when proId is truthy", () => {
      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { rerender } = renderHook(({ proId }) => useProDetail(proId), {
        initialProps: { proId: undefined as string | undefined },
      });

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );

      rerender({ proId: "pro-1" });

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });
});

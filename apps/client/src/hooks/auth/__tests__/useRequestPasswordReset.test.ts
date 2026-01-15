import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequestPasswordReset } from "../useRequestPasswordReset";
import { mockTrpcAuthRequestPasswordReset } from "@/test-setup";

describe("useRequestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state", () => {
    mockTrpcAuthRequestPasswordReset.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(typeof result.current.requestPasswordReset).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call mutation with correct email", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });

    mockTrpcAuthRequestPasswordReset.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    await act(async () => {
      await result.current.requestPasswordReset("test@example.com");
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: "test@example.com" });
  });

  it("should handle mutation pending state", () => {
    mockTrpcAuthRequestPasswordReset.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(result.current.isPending).toBe(true);
  });

  it("should handle mutation error", () => {
    const mockError = { message: "Failed to send email" };

    mockTrpcAuthRequestPasswordReset.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(result.current.error).toEqual(mockError);
  });

  it("should throw error when mutation fails", async () => {
    const mockError = new Error("Network error");
    const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

    mockTrpcAuthRequestPasswordReset.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    await act(async () => {
      await expect(
        result.current.requestPasswordReset("test@example.com")
      ).rejects.toThrow("Network error");
    });
  });
});

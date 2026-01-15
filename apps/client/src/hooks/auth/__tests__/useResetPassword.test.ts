import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useResetPassword } from "../useResetPassword";
import { mockTrpcAuthResetPassword } from "@/test-setup";

// Mock useRouter
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

describe("useResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state", () => {
    mockTrpcAuthResetPassword.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    expect(typeof result.current.resetPassword).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call mutation with correct token and password", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });

    let onSuccessCallback: (() => void) | undefined;

    mockTrpcAuthResetPassword.mockImplementation(
      (options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutateAsync: async (input: unknown) => {
            const result = await mockMutateAsync(input);
            onSuccessCallback?.();
            return result;
          },
          isPending: false,
          error: null,
        };
      }
    );

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.resetPassword("token-123", "newPassword123");
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      token: "token-123",
      newPassword: "newPassword123",
    });
  });

  it("should redirect to login on success", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });

    let onSuccessCallback: (() => void) | undefined;

    mockTrpcAuthResetPassword.mockImplementation(
      (options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutateAsync: async (input: unknown) => {
            const result = await mockMutateAsync(input);
            setTimeout(() => onSuccessCallback?.(), 0);
            return result;
          },
          isPending: false,
          error: null,
        };
      }
    );

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.resetPassword("token-123", "newPassword123");
    });

    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          "/login?passwordReset=true"
        );
      },
      { timeout: 2000 }
    );
  });

  it("should handle mutation pending state", () => {
    mockTrpcAuthResetPassword.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isPending).toBe(true);
  });

  it("should handle mutation error", () => {
    const mockError = { message: "Invalid token" };

    mockTrpcAuthResetPassword.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useResetPassword());

    expect(result.current.error).toEqual(mockError);
  });

  it("should throw error when mutation fails", async () => {
    const mockError = new Error("Invalid token");
    const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

    mockTrpcAuthResetPassword.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await expect(
        result.current.resetPassword("invalid-token", "newPassword123")
      ).rejects.toThrow("Invalid token");
    });
  });
});

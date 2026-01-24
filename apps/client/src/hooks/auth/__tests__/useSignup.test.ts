import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSignup } from "../useSignup";
import { mockTrpcAuthSignup } from "@/test-setup";

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

describe("useSignup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when signup succeeds", () => {
    it("should redirect to confirm-email with email", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        email: "test@example.com",
      });

      let onSuccessCallback: ((data: { email: string }) => void) | undefined;

      mockTrpcAuthSignup.mockImplementation(
        (options?: { onSuccess?: (data: { email: string }) => void }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async (input: unknown) => {
              const result = await mockMutateAsync(input);
              onSuccessCallback?.(result);
              return result;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useSignup());

      await act(async () => {
        await result.current.signup({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith(
            "/confirm-email?email=test%40example.com"
          );
        },
        { timeout: 2000 }
      );
    });

    it("should include returnUrl in redirect when provided", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        email: "test@example.com",
      });

      let onSuccessCallback: ((data: { email: string }) => void) | undefined;

      mockTrpcAuthSignup.mockImplementation(
        (options?: { onSuccess?: (data: { email: string }) => void }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async (input: unknown) => {
              const result = await mockMutateAsync(input);
              onSuccessCallback?.(result);
              return result;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useSignup("/my-bookings"));

      await act(async () => {
        await result.current.signup({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith(
            "/confirm-email?email=test%40example.com&returnUrl=%2Fmy-bookings"
          );
        },
        { timeout: 2000 }
      );
    });

    it("should not include returnUrl when null", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        email: "test@example.com",
      });

      let onSuccessCallback: ((data: { email: string }) => void) | undefined;

      mockTrpcAuthSignup.mockImplementation(
        (options?: { onSuccess?: (data: { email: string }) => void }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async (input: unknown) => {
              const result = await mockMutateAsync(input);
              onSuccessCallback?.(result);
              return result;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useSignup(null));

      await act(async () => {
        await result.current.signup({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith(
            "/confirm-email?email=test%40example.com"
          );
        },
        { timeout: 2000 }
      );
    });
  });

  describe("when signup fails", () => {
    it("should throw error and not redirect", async () => {
      const mockError = new Error("Signup failed");

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcAuthSignup.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useSignup());

      await act(async () => {
        await expect(
          result.current.signup({
            email: "test@example.com",
            password: "password123",
          })
        ).rejects.toThrow("Signup failed");
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcAuthSignup.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useSignup());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Signup failed");

      mockTrpcAuthSignup.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useSignup());

      expect(result.current.error).toEqual(mockError);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCancelOrder } from "../useCancelOrder";
import { mockTrpcOrderCancel } from "@/test-setup";

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

describe("useCancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when cancellation succeeds", () => {
    it("should redirect to my-jobs on success", async () => {
      let onSuccessCallback: (() => void) | undefined;

      mockTrpcOrderCancel.mockImplementation(
        (options?: { onSuccess?: () => void }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async (input: unknown) => {
              onSuccessCallback?.();
              return input;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useCancelOrder("order-1"));

      await act(async () => {
        await result.current.cancelOrder("order-1");
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/my-jobs");
        },
        { timeout: 2000 }
      );
    });

    it("should call mutation with correct orderId", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

      let onSuccessCallback: (() => void) | undefined;

      mockTrpcOrderCancel.mockImplementation(
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

      const { result } = renderHook(() => useCancelOrder("order-1"));

      await act(async () => {
        await result.current.cancelOrder("order-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
    });
  });

  describe("when cancellation fails", () => {
    it("should throw error and log it", async () => {
      const mockError = new Error("Failed to cancel order");

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcOrderCancel.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCancelOrder("order-1"));

      await act(async () => {
        await expect(result.current.cancelOrder("order-1")).rejects.toThrow(
          "Failed to cancel order"
        );
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcOrderCancel.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useCancelOrder("order-1"));

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Cancellation failed");

      mockTrpcOrderCancel.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useCancelOrder("order-1"));

      expect(result.current.error).toEqual(mockError);
    });
  });
});

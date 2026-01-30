import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCreateOrder } from "../useCreateOrder";
import { mockTrpcOrderCreate } from "@/test-setup";
import { OrderStatus } from "@repo/domain";

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

describe("useCreateOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when order creation succeeds", () => {
    it("should redirect to checkout when status is PENDING_PRO_CONFIRMATION", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        id: "order-1",
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
      });

      let onSuccessCallback:
        | ((data: { id: string; status: OrderStatus }) => void)
        | undefined;

      mockTrpcOrderCreate.mockImplementation(
        (options?: {
          onSuccess?: (data: { id: string; status: OrderStatus }) => void;
        }) => {
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

      const { result } = renderHook(() => useCreateOrder());

      await act(async () => {
        await result.current.createOrder({
          categoryId: "cat-plumbing",
          addressText: "123 Main St",
          scheduledWindowStartAt: new Date(),
          estimatedHours: 2,
        });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        categoryId: "cat-plumbing",
        addressText: "123 Main St",
        scheduledWindowStartAt: expect.any(Date),
        estimatedHours: 2,
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith(
            "/checkout?orderId=order-1"
          );
        },
        { timeout: 2000 }
      );
    });

    it("should redirect to order detail when status is not PENDING_PRO_CONFIRMATION", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        id: "order-1",
        status: OrderStatus.ACCEPTED,
      });

      let onSuccessCallback:
        | ((data: { id: string; status: OrderStatus }) => void)
        | undefined;

      mockTrpcOrderCreate.mockImplementation(
        (options?: {
          onSuccess?: (data: { id: string; status: OrderStatus }) => void;
        }) => {
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

      const { result } = renderHook(() => useCreateOrder());

      await act(async () => {
        await result.current.createOrder({
          categoryId: "cat-plumbing",
          addressText: "123 Main St",
          scheduledWindowStartAt: new Date(),
          estimatedHours: 2,
        });
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/my-jobs/order-1");
        },
        { timeout: 2000 }
      );
    });
  });

  describe("when order creation fails", () => {
    it("should throw error and log it", async () => {
      const mockError = new Error("Failed to create order");

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcOrderCreate.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCreateOrder());

      await act(async () => {
        await expect(
          result.current.createOrder({
            categoryId: "cat-plumbing",
            addressText: "123 Main St",
            scheduledWindowStartAt: new Date(),
            estimatedHours: 2,
          })
        ).rejects.toThrow("Failed to create order");
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcOrderCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useCreateOrder());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Creation failed");

      mockTrpcOrderCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useCreateOrder());

      expect(result.current.error).toEqual(mockError);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReviewForm } from "../useReviewForm";
import {
  mockTrpcOrderGetById,
  mockTrpcReviewByOrder,
  mockTrpcReviewCreate,
} from "@/test-setup";
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

describe("useReviewForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when orderId is provided", () => {
    it("should fetch order and review data", () => {
      const mockOrder = {
        id: "order-1",
        status: OrderStatus.COMPLETED,
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("order-1"));

      expect(result.current.order).toEqual(mockOrder);
      expect(result.current.existingReview).toBeUndefined();
      expect(result.current.canCreateReview).toBe(true);
    });

    it("should create review and redirect on success", async () => {
      const mockOrder = {
        id: "order-1",
        status: OrderStatus.COMPLETED,
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      let onSuccessCallback: (() => void) | undefined;

      mockTrpcReviewCreate.mockImplementation(
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

      const { result } = renderHook(() => useReviewForm("order-1"));

      await act(async () => {
        await result.current.createReview(5, "Great service");
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/my-jobs/order-1");
        },
        { timeout: 2000 }
      );
    });
  });
});

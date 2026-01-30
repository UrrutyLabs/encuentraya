import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOrderDetail } from "../useOrderDetail";
import {
  mockTrpcOrderGetById,
  mockTrpcProGetById,
  mockTrpcReviewByOrder,
  mockTrpcPaymentGetByOrder,
} from "@/test-setup";
import { OrderStatus } from "@repo/domain";

describe("useOrderDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when orderId is provided", () => {
    it("should fetch order details", () => {
      const mockOrder = {
        id: "order-1",
        proProfileId: "pro-1",
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(mockTrpcOrderGetById).toHaveBeenCalledWith(
        { id: "order-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.order).toEqual(mockOrder);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should fetch pro details when order has proProfileId", () => {
      const mockOrder = {
        id: "order-1",
        proProfileId: "pro-1",
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
      };

      const mockPro = {
        id: "pro-1",
        name: "John Doe",
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: mockPro,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        { id: "pro-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.pro).toEqual(mockPro);
    });

    it("should fetch review when order is completed", () => {
      const mockOrder = {
        id: "order-1",
        proProfileId: "pro-1",
        status: OrderStatus.COMPLETED,
      };

      const mockReview = {
        id: "review-1",
        rating: 5,
        comment: "Great service",
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: mockReview,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(mockTrpcReviewByOrder).toHaveBeenCalledWith(
        { orderId: "order-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.existingReview).toEqual(mockReview);
    });

    it("should fetch payment when order needs payment", () => {
      const mockOrder = {
        id: "order-1",
        proProfileId: "pro-1",
        status: OrderStatus.CONFIRMED,
      };

      const mockPayment = {
        id: "payment-1",
        amountEstimated: 10000,
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: mockPayment,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(mockTrpcPaymentGetByOrder).toHaveBeenCalledWith(
        { orderId: "order-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.payment).toEqual(mockPayment);
    });
  });

  describe("when orderId is undefined", () => {
    it("should disable all queries", () => {
      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useOrderDetail(undefined));

      expect(mockTrpcOrderGetById).toHaveBeenCalledWith(
        { id: "" },
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe("loading state", () => {
    it("should return loading when order is loading", () => {
      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("error state", () => {
    it("should return error when order query fails", () => {
      const mockError = new Error("Failed to fetch order");

      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("refetch function", () => {
    it("should return refetch function from order query", () => {
      const mockRefetch = vi.fn();

      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useOrderDetail("order-1"));

      expect(result.current.refetch).toBe(mockRefetch);
    });
  });
});

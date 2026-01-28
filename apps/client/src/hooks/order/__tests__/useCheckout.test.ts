import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckout } from "../useCheckout";
import {
  mockTrpcOrderGetById,
  mockTrpcPaymentGetByOrder,
  mockTrpcPaymentCreatePreauthForOrder,
} from "@/test-setup";
import { OrderStatus } from "@repo/domain";

// Mock window.location.assign
const mockAssign = vi.fn();
Object.defineProperty(window, "location", {
  value: {
    assign: mockAssign,
  },
  writable: true,
});

describe("useCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when orderId is provided", () => {
    it("should fetch order and payment data", () => {
      const mockOrder = {
        id: "order-1",
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
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: mockPayment,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForOrder.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("order-1"));

      expect(result.current.order).toEqual(mockOrder);
      expect(result.current.payment).toEqual(mockPayment);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it("should authorize payment and redirect to checkout URL", async () => {
      const mockOrder = {
        id: "order-1",
        status: OrderStatus.CONFIRMED,
      };

      const mockPreauthResult = {
        paymentId: "payment-1",
        checkoutUrl: "https://checkout.example.com",
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi.fn().mockResolvedValue(mockPreauthResult);

      mockTrpcPaymentCreatePreauthForOrder.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("order-1"));

      await act(async () => {
        await result.current.authorizePayment();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
      expect(mockAssign).toHaveBeenCalledWith("https://checkout.example.com");
    });
  });

  describe("when orderId is undefined", () => {
    it("should disable queries", () => {
      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByOrder.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForOrder.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      renderHook(() => useCheckout(undefined));

      expect(mockTrpcOrderGetById).toHaveBeenCalledWith(
        { id: "" },
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckout } from "../useCheckout";
import {
  mockTrpcBookingGetById,
  mockTrpcPaymentGetByBooking,
  mockTrpcPaymentCreatePreauthForBooking,
} from "@/test-setup";
import { BookingStatus } from "@repo/domain";

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

  describe("when bookingId is provided", () => {
    it("should fetch booking and payment data", () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      const mockPayment = {
        id: "payment-1",
        amount: 10000,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: mockPayment,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("booking-1"));

      expect(result.current.booking).toEqual(mockBooking);
      expect(result.current.payment).toEqual(mockPayment);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it("should return loading when booking is loading", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("booking-1"));

      expect(result.current.isLoading).toBe(true);
    });

    it("should return loading when payment is loading", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("booking-1"));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("payment authorization", () => {
    it("should redirect to checkout URL on success", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      let onSuccessCallback:
        | ((data: { checkoutUrl?: string }) => void)
        | undefined;

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(
        (options?: {
          onSuccess?: (data: { checkoutUrl?: string }) => void;
        }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async () => {
              const result = { checkoutUrl: "https://checkout.example.com" };
              onSuccessCallback?.(result);
              return result;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useCheckout("booking-1"));

      await act(async () => {
        await result.current.authorizePayment();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAssign).toHaveBeenCalledWith("https://checkout.example.com");
    });

    it("should set error when checkoutUrl is missing", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      let onSuccessCallback:
        | ((data: { checkoutUrl?: string }) => void)
        | undefined;

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(
        (options?: {
          onSuccess?: (data: { checkoutUrl?: string }) => void;
        }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            mutateAsync: async () => {
              const result = {};
              onSuccessCallback?.(result);
              return result;
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useCheckout("booking-1"));

      await act(async () => {
        await result.current.authorizePayment();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe(
        "No se pudo obtener la URL de pago. Probá de nuevo."
      );
      expect(mockAssign).not.toHaveBeenCalled();
    });

    it("should set error on mutation error", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      let onErrorCallback: (() => void) | undefined;

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(
        (options?: { onError?: () => void }) => {
          onErrorCallback = options?.onError;
          return {
            mutateAsync: async () => {
              onErrorCallback?.();
              throw new Error("Payment failed");
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useCheckout("booking-1"));

      await act(async () => {
        await result.current.authorizePayment();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe(
        "No pudimos iniciar el pago. Probá de nuevo."
      );
    });

    it("should call mutation with bookingId", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi
        .fn()
        .mockResolvedValue({ checkoutUrl: "https://checkout.example.com" });

      let onSuccessCallback:
        | ((data: { checkoutUrl?: string }) => void)
        | undefined;

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(
        (options?: {
          onSuccess?: (data: { checkoutUrl?: string }) => void;
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

      const { result } = renderHook(() => useCheckout("booking-1"));

      await act(async () => {
        await result.current.authorizePayment();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should clear error before authorizing", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi
        .fn()
        .mockResolvedValue({ checkoutUrl: "https://checkout.example.com" });

      let onSuccessCallback:
        | ((data: { checkoutUrl?: string }) => void)
        | undefined;

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(
        (options?: {
          onSuccess?: (data: { checkoutUrl?: string }) => void;
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

      const { result } = renderHook(() => useCheckout("booking-1"));

      // Set initial error
      act(() => {
        result.current.authorizePayment();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Error should be cleared before mutation
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("when bookingId is undefined", () => {
    it("should not authorize payment", async () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi.fn();

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout(undefined));

      await act(async () => {
        await result.current.authorizePayment();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("mutation state", () => {
    it("should return isAuthorizing state", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useCheckout("booking-1"));

      expect(result.current.isAuthorizing).toBe(true);
    });

    it("should return error from mutation", () => {
      const mockError = { message: "Payment failed" };

      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentCreatePreauthForBooking.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useCheckout("booking-1"));

      expect(result.current.error).toBe("Payment failed");
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBookingDetail } from "../useBookingDetail";
import {
  mockTrpcBookingGetById,
  mockTrpcProGetById,
  mockTrpcReviewByBooking,
  mockTrpcPaymentGetByBooking,
} from "@/test-setup";
import { BookingStatus } from "@repo/domain";

describe("useBookingDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when bookingId is provided", () => {
    it("should fetch booking details", () => {
      const mockBooking = {
        id: "booking-1",
        proId: "pro-1",
        status: BookingStatus.PENDING,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(mockTrpcBookingGetById).toHaveBeenCalledWith(
        { id: "booking-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.booking).toEqual(mockBooking);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should fetch pro details when booking has proId", () => {
      const mockBooking = {
        id: "booking-1",
        proId: "pro-1",
        status: BookingStatus.PENDING,
      };

      const mockPro = {
        id: "pro-1",
        name: "John Doe",
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: mockPro,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(mockTrpcProGetById).toHaveBeenCalledWith(
        { id: "pro-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.pro).toEqual(mockPro);
    });

    it("should fetch review when booking is completed", () => {
      const mockBooking = {
        id: "booking-1",
        proId: "pro-1",
        status: BookingStatus.COMPLETED,
      };

      const mockReview = {
        id: "review-1",
        rating: 5,
        comment: "Great service",
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: mockReview,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(mockTrpcReviewByBooking).toHaveBeenCalledWith(
        { bookingId: "booking-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.existingReview).toEqual(mockReview);
    });

    it("should fetch payment when booking is PENDING_PAYMENT", () => {
      const mockBooking = {
        id: "booking-1",
        proId: "pro-1",
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
        refetch: vi.fn(),
      });

      mockTrpcProGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: mockPayment,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(mockTrpcPaymentGetByBooking).toHaveBeenCalledWith(
        { bookingId: "booking-1" },
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );

      expect(result.current.payment).toEqual(mockPayment);
    });
  });

  describe("when bookingId is undefined", () => {
    it("should disable all queries", () => {
      mockTrpcBookingGetById.mockReturnValue({
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

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useBookingDetail(undefined));

      expect(mockTrpcBookingGetById).toHaveBeenCalledWith(
        { id: "" },
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe("loading state", () => {
    it("should return loading when booking is loading", () => {
      mockTrpcBookingGetById.mockReturnValue({
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

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("error state", () => {
    it("should return error when booking query fails", () => {
      const mockError = new Error("Failed to fetch booking");

      mockTrpcBookingGetById.mockReturnValue({
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

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("refetch function", () => {
    it("should return refetch function from booking query", () => {
      const mockRefetch = vi.fn();

      mockTrpcBookingGetById.mockReturnValue({
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

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcPaymentGetByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingDetail("booking-1"));

      expect(result.current.refetch).toBe(mockRefetch);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMyBookings } from "../useMyBookings";
import {
  mockTrpcBookingMyBookings,
  mockTrpcReviewStatusByBookingIds,
} from "@/test-setup";
import { BookingStatus, Category } from "@repo/domain";
import type { Booking } from "@repo/domain";

describe("useMyBookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when bookings are loaded", () => {
    it("should return bookings array", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
        },
      ] as unknown as Booking[];

      mockTrpcBookingMyBookings.mockReturnValue({
        data: mockBookings,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyBookings());

      expect(result.current.bookings).toEqual(mockBookings);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.reviewStatusMap).toEqual({});
    });

    it("should return empty array when bookings is null", () => {
      mockTrpcBookingMyBookings.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyBookings());

      expect(result.current.bookings).toEqual([]);
    });
  });

  describe("review status map", () => {
    it("should fetch review status for completed bookings", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.COMPLETED,
          category: Category.PLUMBING,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
        },
        {
          id: "booking-3",
          status: BookingStatus.PENDING,
          category: Category.CLEANING,
        },
      ] as unknown as Booking[];

      mockTrpcBookingMyBookings.mockReturnValue({
        data: mockBookings,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {
          "booking-1": true,
          "booking-2": false,
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyBookings());

      expect(result.current.reviewStatusMap).toEqual({
        "booking-1": true,
        "booking-2": false,
      });
    });

    it("should not fetch review status when no completed bookings", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
        },
      ] as unknown as Booking[];

      mockTrpcBookingMyBookings.mockReturnValue({
        data: mockBookings,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyBookings());

      expect(mockTrpcReviewStatusByBookingIds).toHaveBeenCalledWith(
        { bookingIds: [] },
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe("loading and error states", () => {
    it("should return loading state when bookings are loading", () => {
      mockTrpcBookingMyBookings.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyBookings());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.bookings).toEqual([]);
    });

    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch bookings");

      mockTrpcBookingMyBookings.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyBookings());

      expect(result.current.error).toEqual(mockError);
      expect(result.current.bookings).toEqual([]);
    });
  });

  describe("query configuration", () => {
    it("should enable query when user exists", () => {
      mockTrpcBookingMyBookings.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyBookings());

      expect(mockTrpcBookingMyBookings).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );
    });

    it("should set retry to false", () => {
      mockTrpcBookingMyBookings.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByBookingIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyBookings());

      expect(mockTrpcBookingMyBookings).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          retry: false,
        })
      );
    });
  });
});

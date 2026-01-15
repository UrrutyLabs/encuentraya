import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReviewForm } from "../useReviewForm";
import {
  mockTrpcBookingGetById,
  mockTrpcReviewByBooking,
  mockTrpcReviewCreate,
} from "@/test-setup";
import { BookingStatus } from "@repo/domain";

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

  describe("when bookingId is provided", () => {
    it("should fetch booking and review data", () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.booking).toEqual(mockBooking);
      expect(result.current.existingReview).toBeUndefined();
      expect(result.current.canCreateReview).toBe(true);
    });

    it("should return canCreateReview false when booking is not completed", () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.PENDING,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.canCreateReview).toBe(false);
    });

    it("should return canCreateReview false when review already exists", () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      };

      const mockReview = {
        id: "review-1",
        rating: 5,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: mockReview,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.canCreateReview).toBe(false);
      expect(result.current.existingReview).toEqual(mockReview);
    });
  });

  describe("review creation", () => {
    it("should create review and redirect on success", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      let onSuccessCallback: (() => void) | undefined;

      mockTrpcReviewCreate.mockImplementation((options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutateAsync: async (input: unknown) => {
            onSuccessCallback?.();
            return input;
          },
          isPending: false,
          error: null,
        };
      });

      const { result } = renderHook(() => useReviewForm("booking-1"));

      await act(async () => {
        await result.current.createReview(5, "Great service!");
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/my-bookings/booking-1");
        },
        { timeout: 2000 }
      );
    });

    it("should call mutation with correct input", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

      let onSuccessCallback: (() => void) | undefined;

      mockTrpcReviewCreate.mockImplementation((options?: { onSuccess?: () => void }) => {
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
      });

      const { result } = renderHook(() => useReviewForm("booking-1"));

      await act(async () => {
        await result.current.createReview(5, "Great service!");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        bookingId: "booking-1",
        rating: 5,
        comment: "Great service!",
      });
    });

    it("should handle optional comment", async () => {
      const mockBooking = {
        id: "booking-1",
        status: BookingStatus.COMPLETED,
      };

      mockTrpcBookingGetById.mockReturnValue({
        data: mockBooking,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

      let onSuccessCallback: (() => void) | undefined;

      mockTrpcReviewCreate.mockImplementation((options?: { onSuccess?: () => void }) => {
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
      });

      const { result } = renderHook(() => useReviewForm("booking-1"));

      await act(async () => {
        await result.current.createReview(5);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        bookingId: "booking-1",
        rating: 5,
        comment: undefined,
      });
    });

    it("should not create review when bookingId is undefined", async () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const mockMutateAsync = vi.fn();

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm(undefined));

      await act(async () => {
        await result.current.createReview(5, "Great service!");
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("should return loading when booking is loading", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.isLoading).toBe(true);
    });

    it("should return loading when review is loading", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Review creation failed");

      mockTrpcBookingGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewByBooking.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useReviewForm("booking-1"));

      expect(result.current.error).toEqual(mockError);
    });
  });
});

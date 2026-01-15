import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCreateBooking } from "../useCreateBooking";
import { mockTrpcBookingCreate } from "@/test-setup";
import { BookingStatus, Category } from "@repo/domain";

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

describe("useCreateBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when booking creation succeeds", () => {
    it("should redirect to checkout when status is PENDING_PAYMENT", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        id: "booking-1",
        status: BookingStatus.PENDING_PAYMENT,
      });

      let onSuccessCallback: ((data: { id: string; status: BookingStatus }) => void) | undefined;

      mockTrpcBookingCreate.mockImplementation((options?: { onSuccess?: (data: { id: string; status: BookingStatus }) => void }) => {
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
      });

      const { result } = renderHook(() => useCreateBooking());

      await act(async () => {
        await result.current.createBooking({
          proId: "pro-1",
          category: Category.PLUMBING,
          description: "Fix leak",
          scheduledAt: new Date(),
          estimatedHours: 2,
        });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        proId: "pro-1",
        category: Category.PLUMBING,
        description: "Fix leak",
        scheduledAt: expect.any(Date),
        estimatedHours: 2,
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/checkout?bookingId=booking-1");
        },
        { timeout: 2000 }
      );
    });

    it("should redirect to booking detail when status is not PENDING_PAYMENT", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        id: "booking-1",
        status: BookingStatus.PENDING,
      });

      let onSuccessCallback: ((data: { id: string; status: BookingStatus }) => void) | undefined;

      mockTrpcBookingCreate.mockImplementation((options?: { onSuccess?: (data: { id: string; status: BookingStatus }) => void }) => {
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
      });

      const { result } = renderHook(() => useCreateBooking());

      await act(async () => {
        await result.current.createBooking({
          proId: "pro-1",
          category: Category.PLUMBING,
          description: "Fix leak",
          scheduledAt: new Date(),
          estimatedHours: 2,
        });
      });

      await waitFor(
        () => {
          expect(mockRouter.push).toHaveBeenCalledWith("/my-bookings/booking-1");
        },
        { timeout: 2000 }
      );
    });
  });

  describe("when booking creation fails", () => {
    it("should throw error and log it", async () => {
      const mockError = new Error("Failed to create booking");

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcBookingCreate.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useCreateBooking());

      await act(async () => {
        await expect(
          result.current.createBooking({
            proId: "pro-1",
            category: Category.PLUMBING,
            description: "Fix leak",
            scheduledAt: new Date(),
            estimatedHours: 2,
          })
        ).rejects.toThrow("Failed to create booking");
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcBookingCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useCreateBooking());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Creation failed");

      mockTrpcBookingCreate.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useCreateBooking());

      expect(result.current.error).toEqual(mockError);
    });
  });
});

import { renderHook, waitFor, act } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../../shared/useQueryClient";
import { useBookingActions } from "../useBookingActions";
import { BookingStatus } from "@repo/domain";
import type { Booking } from "@repo/domain";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useQueryClient");

const mockQueryClient = {
  cancelQueries: jest.fn(),
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
};

const mockAcceptMutation = jest.fn();
const mockRejectMutation = jest.fn();
const mockOnMyWayMutation = jest.fn();
const mockArriveMutation = jest.fn();
const mockCompleteMutation = jest.fn();

describe("useBookingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    (trpc as any).booking = {
      accept: { useMutation: mockAcceptMutation },
      reject: { useMutation: mockRejectMutation },
      onMyWay: { useMutation: mockOnMyWayMutation },
      arrive: { useMutation: mockArriveMutation },
      complete: { useMutation: mockCompleteMutation },
    };
  });

  describe("initial state", () => {
    it("should return all action functions and loading states", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(typeof result.current.acceptBooking).toBe("function");
      expect(typeof result.current.rejectBooking).toBe("function");
      expect(typeof result.current.markOnMyWay).toBe("function");
      expect(typeof result.current.arriveBooking).toBe("function");
      expect(typeof result.current.completeBooking).toBe("function");
      expect(result.current.isAccepting).toBe(false);
      expect(result.current.isRejecting).toBe(false);
      expect(result.current.isMarkingOnMyWay).toBe(false);
      expect(result.current.isArriving).toBe(false);
      expect(result.current.isCompleting).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("acceptBooking", () => {
    it("should call accept mutation with bookingId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.acceptBooking("booking-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should clear error before accepting", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.acceptBooking("booking-1");
      });

      expect(result.current.error).toBe(null);
    });

    it("should set error and throw when mutation fails", async () => {
      const errorMessage = "Failed to accept booking";
      const mockMutateAsync = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        try {
          await result.current.acceptBooking("booking-1");
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it("should call onSuccess callback when provided", async () => {
      const onSuccess = jest.fn();
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onSuccessCallback: () => void;

      mockAcceptMutation.mockImplementation((options) => {
        onSuccessCallback = options.onSuccess;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions(onSuccess));

      await act(async () => {
        await result.current.acceptBooking("booking-1");
      });

      await act(() => {
        if (onSuccessCallback!) {
          onSuccessCallback();
        }
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it("should return isAccepting true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(result.current.isAccepting).toBe(true);
    });
  });

  describe("rejectBooking", () => {
    it("should call reject mutation with bookingId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.rejectBooking("booking-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should return isRejecting true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(result.current.isRejecting).toBe(true);
    });
  });

  describe("markOnMyWay", () => {
    it("should call onMyWay mutation with bookingId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.markOnMyWay("booking-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should return isMarkingOnMyWay true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(result.current.isMarkingOnMyWay).toBe(true);
    });
  });

  describe("arriveBooking", () => {
    it("should call arrive mutation with bookingId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.arriveBooking("booking-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should return isArriving true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(result.current.isArriving).toBe(true);
    });
  });

  describe("completeBooking", () => {
    it("should call complete mutation with bookingId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.completeBooking("booking-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ bookingId: "booking-1" });
    });

    it("should return isCompleting true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useBookingActions());

      expect(result.current.isCompleting).toBe(true);
    });
  });

  describe("optimistic updates", () => {
    it("should cancel queries and update booking status optimistically", async () => {
      const mockBooking: Booking = {
        id: "booking-1",
        displayId: "A1",
        clientId: "client-1",
        proId: "pro-1",
        category: "plumbing" as any,
        description: "Fix leak",
        status: BookingStatus.PENDING,
        scheduledAt: new Date(),
        hourlyRate: 50,
        estimatedHours: 2,
        totalAmount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryClient.getQueryData.mockReturnValue(mockBooking);
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onMutateCallback: (variables: { bookingId: string }) => Promise<any>;

      mockAcceptMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.acceptBooking("booking-1");
      });

      await act(async () => {
        if (onMutateCallback!) {
          await onMutateCallback({ bookingId: "booking-1" });
        }
      });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalled();
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        [["booking", "getById"], { id: "booking-1" }],
        expect.objectContaining({
          status: BookingStatus.ACCEPTED,
        })
      );
    });

    it("should provide context for rollback on error", async () => {
      const mockBooking: Booking = {
        id: "booking-1",
        displayId: "A1",
        clientId: "client-1",
        proId: "pro-1",
        category: "plumbing" as any,
        description: "Fix leak",
        status: BookingStatus.PENDING,
        scheduledAt: new Date(),
        hourlyRate: 50,
        estimatedHours: 2,
        totalAmount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryClient.getQueryData.mockReturnValue(mockBooking);
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onMutateCallback: (variables: { bookingId: string }) => Promise<any>;

      mockAcceptMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useBookingActions());

      // Call onMutate to verify it returns context with previousBooking
      const context = await act(async () => {
        if (onMutateCallback!) {
          return await onMutateCallback({ bookingId: "booking-1" });
        }
        return null;
      });

      // Verify context contains previousBooking for potential rollback
      expect(context).toEqual({ previousBooking: mockBooking });
      expect(context?.previousBooking).toEqual(mockBooking);
    });

    it("should invalidate queries on settled", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onSettledCallback: (
        data: unknown,
        error: unknown,
        variables: { bookingId: string }
      ) => void;

      mockAcceptMutation.mockImplementation((options) => {
        onSettledCallback = options.onSettled;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        await result.current.acceptBooking("booking-1");
      });

      await act(() => {
        if (onSettledCallback!) {
          onSettledCallback(undefined, null, { bookingId: "booking-1" });
        }
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["booking", "getById"], { id: "booking-1" }],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["booking", "proInbox"]],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["booking", "proJobs"]],
      });
    });
  });

  describe("error handling", () => {
    it("should set default error message when error has no message", async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error());
      let onErrorCallback: (err: Error) => void;

      mockAcceptMutation.mockImplementation((options) => {
        onErrorCallback = options.onError;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockRejectMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockOnMyWayMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockArriveMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCompleteMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useBookingActions());

      await act(async () => {
        try {
          await result.current.acceptBooking("booking-1");
        } catch {
          // Expected to throw
        }
      });

      await act(() => {
        if (onErrorCallback!) {
          onErrorCallback(new Error());
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Error al aceptar la reserva");
      });
    });
  });
});

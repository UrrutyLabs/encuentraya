import { renderHook, waitFor, act } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../../shared/useQueryClient";
import { useOrderActions } from "../useOrderActions";
import { OrderStatus } from "@repo/domain";
import type { Order } from "@repo/domain";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useQueryClient");

const mockQueryClient = {
  cancelQueries: jest.fn(),
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
};

const mockAcceptMutation = jest.fn();
const mockCancelMutation = jest.fn();
const mockMarkInProgressMutation = jest.fn();
const mockMarkArrivedMutation = jest.fn();
const mockSubmitHoursMutation = jest.fn();

describe("useOrderActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    (trpc as any).order = {
      accept: { useMutation: mockAcceptMutation },
      cancel: { useMutation: mockCancelMutation },
      markInProgress: { useMutation: mockMarkInProgressMutation },
      markArrived: { useMutation: mockMarkArrivedMutation },
      submitHours: { useMutation: mockSubmitHoursMutation },
    };
  });

  describe("initial state", () => {
    it("should return all action functions and loading states", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(typeof result.current.acceptOrder).toBe("function");
      expect(typeof result.current.rejectOrder).toBe("function");
      expect(typeof result.current.markOnMyWay).toBe("function");
      expect(typeof result.current.arriveOrder).toBe("function");
      expect(typeof result.current.completeOrder).toBe("function");
      expect(result.current.isAccepting).toBe(false);
      expect(result.current.isRejecting).toBe(false);
      expect(result.current.isMarkingOnMyWay).toBe(false);
      expect(result.current.isArriving).toBe(false);
      expect(result.current.isCompleting).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("acceptOrder", () => {
    it("should call accept mutation with orderId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.acceptOrder("order-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
    });

    it("should clear error before accepting", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.acceptOrder("order-1");
      });

      expect(result.current.error).toBe(null);
    });

    it("should set error and throw when mutation fails", async () => {
      const errorMessage = "Failed to accept order";
      const mockMutateAsync = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      mockAcceptMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        try {
          await result.current.acceptOrder("order-1");
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
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions(onSuccess));

      await act(async () => {
        await result.current.acceptOrder("order-1");
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
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(result.current.isAccepting).toBe(true);
    });
  });

  describe("rejectOrder", () => {
    it("should call cancel mutation with orderId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.rejectOrder("order-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: "order-1",
        reason: undefined,
      });
    });

    it("should return isRejecting true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(result.current.isRejecting).toBe(true);
    });
  });

  describe("markOnMyWay", () => {
    it("should call markInProgress mutation with orderId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.markOnMyWay("order-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
    });

    it("should return isMarkingOnMyWay true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(result.current.isMarkingOnMyWay).toBe(true);
    });
  });

  describe("arriveOrder", () => {
    it("should call markArrived mutation with orderId", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.arriveOrder("order-1");
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ orderId: "order-1" });
    });

    it("should return isArriving true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(result.current.isArriving).toBe(true);
    });
  });

  describe("completeOrder", () => {
    it("should call submitHours mutation with orderId and finalHours", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.completeOrder("order-1", 2.5);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: "order-1",
        finalHours: 2.5,
      });
    });

    it("should return isCompleting true when mutation is pending", () => {
      mockAcceptMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useOrderActions());

      expect(result.current.isCompleting).toBe(true);
    });
  });

  describe("optimistic updates", () => {
    it("should cancel queries and update order status optimistically", async () => {
      const mockOrder: Order = {
        id: "order-1",
        displayId: "ORD-001",
        clientUserId: "client-1",
        proProfileId: "pro-1",
        categoryId: "cat-1",
        subcategoryId: null,
        categoryMetadataJson: null,
        title: null,
        description: "Fix leak",
        addressText: "123 Main St",
        addressLat: null,
        addressLng: null,
        scheduledWindowStartAt: new Date(),
        scheduledWindowEndAt: null,
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        acceptedAt: null,
        confirmedAt: null,
        startedAt: null,
        arrivedAt: null,
        completedAt: null,
        paidAt: null,
        canceledAt: null,
        cancelReason: null,
        pricingMode: "hourly" as any,
        hourlyRateSnapshotAmount: 50,
        currency: "UYU",
        minHoursSnapshot: null,
        estimatedHours: 2,
        finalHoursSubmitted: null,
        approvedHours: null,
        approvalMethod: null,
        approvalDeadlineAt: null,
        subtotalAmount: null,
        platformFeeAmount: null,
        taxAmount: null,
        totalAmount: 100,
        totalsCalculatedAt: null,
        taxScheme: null,
        taxRate: null,
        taxIncluded: false,
        taxRegion: null,
        taxCalculatedAt: null,
        disputeStatus: "none" as any,
        disputeReason: null,
        disputeOpenedBy: null,
        isFirstOrder: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryClient.getQueryData.mockReturnValue(mockOrder);
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onMutateCallback: (variables: { orderId: string }) => Promise<any>;

      mockAcceptMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.acceptOrder("order-1");
      });

      await act(async () => {
        if (onMutateCallback!) {
          await onMutateCallback({ orderId: "order-1" });
        }
      });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalled();
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        [["order", "getById"], { id: "order-1" }],
        expect.objectContaining({
          status: OrderStatus.ACCEPTED,
        })
      );
    });

    it("should provide context for rollback on error", async () => {
      const mockOrder: Order = {
        id: "order-1",
        displayId: "ORD-001",
        clientUserId: "client-1",
        proProfileId: "pro-1",
        categoryId: "cat-1",
        subcategoryId: null,
        categoryMetadataJson: null,
        title: null,
        description: "Fix leak",
        addressText: "123 Main St",
        addressLat: null,
        addressLng: null,
        scheduledWindowStartAt: new Date(),
        scheduledWindowEndAt: null,
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        acceptedAt: null,
        confirmedAt: null,
        startedAt: null,
        arrivedAt: null,
        completedAt: null,
        paidAt: null,
        canceledAt: null,
        cancelReason: null,
        pricingMode: "hourly" as any,
        hourlyRateSnapshotAmount: 50,
        currency: "UYU",
        minHoursSnapshot: null,
        estimatedHours: 2,
        finalHoursSubmitted: null,
        approvedHours: null,
        approvalMethod: null,
        approvalDeadlineAt: null,
        subtotalAmount: null,
        platformFeeAmount: null,
        taxAmount: null,
        totalAmount: 100,
        totalsCalculatedAt: null,
        taxScheme: null,
        taxRate: null,
        taxIncluded: false,
        taxRegion: null,
        taxCalculatedAt: null,
        disputeStatus: "none" as any,
        disputeReason: null,
        disputeOpenedBy: null,
        isFirstOrder: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryClient.getQueryData.mockReturnValue(mockOrder);
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onMutateCallback: (variables: { orderId: string }) => Promise<any>;

      mockAcceptMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      renderHook(() => useOrderActions());

      // Call onMutate to verify it returns context with previousOrder
      const context = await act(async () => {
        if (onMutateCallback!) {
          return await onMutateCallback({ orderId: "order-1" });
        }
        return null;
      });

      // Verify context contains previousOrder for potential rollback
      expect(context).toEqual({ previousOrder: mockOrder });
      expect(context?.previousOrder).toEqual(mockOrder);
    });

    it("should invalidate queries on settled", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      let onSettledCallback: (
        data: unknown,
        error: unknown,
        variables: { orderId: string }
      ) => void;

      mockAcceptMutation.mockImplementation((options) => {
        onSettledCallback = options.onSettled;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        await result.current.acceptOrder("order-1");
      });

      await act(() => {
        if (onSettledCallback!) {
          onSettledCallback(undefined, null, { orderId: "order-1" });
        }
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["order", "getById"], { id: "order-1" }],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["order", "listByPro"]],
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
      mockCancelMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkInProgressMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockMarkArrivedMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });
      mockSubmitHoursMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useOrderActions());

      await act(async () => {
        try {
          await result.current.acceptOrder("order-1");
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
        expect(result.current.error).toBe("Error al aceptar el trabajo");
      });
    });
  });
});

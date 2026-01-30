import { renderHook } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../../shared/useSmartPolling";
import { useOrderDetail } from "../useOrderDetail";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useSmartPolling");

const mockUseQuery = jest.fn();
const mockUseSmartPolling = useSmartPolling as jest.Mock;

describe("useOrderDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSmartPolling.mockReturnValue({
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

    (trpc as any).order = {
      getById: {
        useQuery: mockUseQuery,
      },
    };
  });

  it("should return order data when query succeeds", () => {
    const mockOrder = {
      id: "order-1",
      displayId: "ORD-001",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "plumbing",
      description: "Fix leak",
      status: "pending_pro_confirmation",
      scheduledWindowStartAt: new Date(),
      estimatedHours: 2,
      totalAmount: 100,
      isFirstOrder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseQuery.mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useOrderDetail("order-1"));

    expect(result.current.order).toBe(mockOrder);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should return loading state when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useOrderDetail("order-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.order).toBeUndefined();
  });

  it("should return error when query fails", () => {
    const mockError = { message: "Order not found" };
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useOrderDetail("order-1"));

    expect(result.current.error).toBe(mockError);
    expect(result.current.order).toBeUndefined();
  });

  it("should use smart polling options", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useOrderDetail("order-1"));

    expect(mockUseSmartPolling).toHaveBeenCalledWith({
      interval: 5000,
      enabled: true,
      refetchOnForeground: true,
    });
  });

  it("should disable query when orderId is undefined", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useOrderDetail(undefined));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "" },
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("should enable query when orderId is provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useOrderDetail("order-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "order-1" },
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it("should disable smart polling when orderId is undefined", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useOrderDetail(undefined));

    expect(mockUseSmartPolling).toHaveBeenCalledWith({
      interval: 5000,
      enabled: false,
      refetchOnForeground: true,
    });
  });

  it("should return refetch function", () => {
    const mockRefetch = jest.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useOrderDetail("order-1"));

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it("should configure retry to false", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useOrderDetail("order-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "order-1" },
      expect.objectContaining({
        retry: false,
      })
    );
  });
});

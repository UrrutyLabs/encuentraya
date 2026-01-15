import { renderHook } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../../shared/useSmartPolling";
import { useBookingDetail } from "../useBookingDetail";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useSmartPolling");

const mockUseQuery = jest.fn();
const mockUseSmartPolling = useSmartPolling as jest.Mock;

describe("useBookingDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSmartPolling.mockReturnValue({
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

    (trpc as any).booking = {
      getById: {
        useQuery: mockUseQuery,
      },
    };
  });

  it("should return booking data when query succeeds", () => {
    const mockBooking = {
      id: "booking-1",
      clientId: "client-1",
      proId: "pro-1",
      category: "plumbing",
      description: "Fix leak",
      status: "pending",
      scheduledAt: new Date(),
      hourlyRate: 50,
      estimatedHours: 2,
      totalAmount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseQuery.mockReturnValue({
      data: mockBooking,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useBookingDetail("booking-1"));

    expect(result.current.booking).toBe(mockBooking);
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

    const { result } = renderHook(() => useBookingDetail("booking-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.booking).toBeUndefined();
  });

  it("should return error when query fails", () => {
    const mockError = { message: "Booking not found" };
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useBookingDetail("booking-1"));

    expect(result.current.error).toBe(mockError);
    expect(result.current.booking).toBeUndefined();
  });

  it("should use smart polling options", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useBookingDetail("booking-1"));

    expect(mockUseSmartPolling).toHaveBeenCalledWith({
      interval: 5000,
      enabled: true,
      refetchOnForeground: true,
    });
  });

  it("should disable query when bookingId is undefined", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useBookingDetail(undefined));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "" },
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("should enable query when bookingId is provided", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useBookingDetail("booking-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "booking-1" },
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it("should disable smart polling when bookingId is undefined", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useBookingDetail(undefined));

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

    const { result } = renderHook(() => useBookingDetail("booking-1"));

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it("should configure retry to false", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderHook(() => useBookingDetail("booking-1"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { id: "booking-1" },
      expect.objectContaining({
        retry: false,
      })
    );
  });
});

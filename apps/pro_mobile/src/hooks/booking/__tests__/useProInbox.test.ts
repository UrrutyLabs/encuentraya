import { renderHook } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useSmartPolling } from "../../shared/useSmartPolling";
import { useProInbox } from "../useProInbox";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useSmartPolling");

const mockUseQuery = jest.fn();
const mockUseSmartPolling = useSmartPolling as jest.Mock;

describe("useProInbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSmartPolling.mockReturnValue({
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

    (trpc as any).booking = {
      proInbox: {
        useQuery: mockUseQuery,
      },
    };
  });

  it("should return bookings array when query succeeds", () => {
    const mockBookings = [
      {
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
      },
      {
        id: "booking-2",
        clientId: "client-2",
        proId: "pro-1",
        category: "electrical",
        description: "Install outlet",
        status: "accepted",
        scheduledAt: new Date(),
        hourlyRate: 60,
        estimatedHours: 1,
        totalAmount: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockBookings,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProInbox());

    expect(result.current.bookings).toEqual(mockBookings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should return empty array as default when data is undefined", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProInbox());

    expect(result.current.bookings).toEqual([]);
  });

  it("should return loading state when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useProInbox());

    expect(result.current.isLoading).toBe(true);
  });

  it("should return error when query fails", () => {
    const mockError = { message: "Failed to fetch inbox" };
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useProInbox());

    expect(result.current.error).toBe(mockError);
  });

  it("should use smart polling options", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProInbox());

    expect(mockUseSmartPolling).toHaveBeenCalledWith({
      interval: 10000,
      enabled: true,
      refetchOnForeground: true,
    });
  });

  it("should call query with undefined input", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProInbox());

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, expect.any(Object));
  });

  it("should configure retry to false", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProInbox());

    expect(mockUseQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        retry: false,
      })
    );
  });
});

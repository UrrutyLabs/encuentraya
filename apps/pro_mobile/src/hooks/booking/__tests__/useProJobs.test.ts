import { renderHook, waitFor } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { supabase } from "@lib/supabase/client";
import { useSmartPolling } from "../../shared/useSmartPolling";
import { usePushToken } from "../../shared/usePushToken";
import { useProJobs } from "../useProJobs";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useSmartPolling");
jest.mock("../../shared/usePushToken");

const mockUseQuery = jest.fn();
const mockUseSmartPolling = useSmartPolling as jest.Mock;
const mockUsePushToken = usePushToken as jest.Mock;
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

describe("useProJobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSmartPolling.mockReturnValue({
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

    mockUsePushToken.mockReturnValue({
      unregisterToken: jest.fn(),
    });

    (trpc as any).booking = {
      proJobs: {
        useQuery: mockUseQuery,
      },
    };

    // Mock Supabase auth
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    (supabase.auth.getSession as jest.Mock) = mockGetSession;
    (supabase.auth.onAuthStateChange as jest.Mock) = mockOnAuthStateChange;
  });

  it("should return bookings array when query succeeds", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        clientId: "client-1",
        proId: "pro-1",
        category: "plumbing",
        description: "Fix leak",
        status: "accepted",
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
        status: "completed",
        scheduledAt: new Date(),
        completedAt: new Date(),
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

    const { result } = renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(result.current.bookings).toEqual(mockBookings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should return empty array as default when data is undefined", async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(result.current.bookings).toEqual([]);
  });

  it("should return loading state when query is loading", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should return error when query fails", async () => {
    const mockError = { message: "Failed to fetch jobs" };
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should use smart polling options", async () => {
    // Mock a user session
    const mockUser = { id: "user-1", email: "test@example.com" } as any;
    const mockSession = { user: mockUser } as any;
    
    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProJobs());

    // Wait for auth to load and smart polling to be called
    await waitFor(() => {
      expect(mockUseSmartPolling).toHaveBeenCalled();
    });

    expect(mockUseSmartPolling).toHaveBeenCalledWith({
      interval: 10000,
      enabled: true,
      refetchOnForeground: true,
    });
  });

  it("should call query with undefined input", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, expect.any(Object));
  });

  it("should configure retry to false", async () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useProJobs());

    // Wait for async auth operations to complete
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalled();
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        retry: false,
      })
    );
  });
});

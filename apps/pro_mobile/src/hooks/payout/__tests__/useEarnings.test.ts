import { renderHook } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useEarnings } from "../useEarnings";

jest.mock("@lib/trpc/client");

const mockUseQuery = jest.fn();

describe("useEarnings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (trpc as any).proPayout = {
      getMineEarnings: {
        useQuery: mockUseQuery,
      },
    };
  });

  it("should return earnings data when query succeeds", () => {
    const mockEarnings = [
      {
        id: "earning-1",
        orderId: "order-1",
        orderDisplayId: "ORD-001",
        grossAmount: 100,
        platformFeeAmount: 10,
        netAmount: 90,
        status: "PAYABLE" as const,
        currency: "UYU",
        availableAt: null,
        createdAt: new Date(),
      },
      {
        id: "earning-2",
        orderId: "order-2",
        orderDisplayId: "ORD-002",
        grossAmount: 150,
        platformFeeAmount: 15,
        netAmount: 135,
        status: "PAID" as const,
        currency: "UYU",
        availableAt: null,
        createdAt: new Date(),
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockEarnings,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useEarnings());

    expect(result.current.data).toEqual(mockEarnings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should pass status filter to query", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useEarnings({ status: "PAYABLE" }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { status: "PAYABLE", limit: undefined, offset: undefined },
      expect.objectContaining({ retry: false })
    );
  });

  it("should pass limit and offset to query", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useEarnings({ limit: 10, offset: 20 }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { status: undefined, limit: 10, offset: 20 },
      expect.objectContaining({ retry: false })
    );
  });

  it("should pass all options to query", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useEarnings({ status: "PENDING", limit: 5, offset: 10 }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { status: "PENDING", limit: 5, offset: 10 },
      expect.objectContaining({ retry: false })
    );
  });

  it("should return loading state when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useEarnings());

    expect(result.current.isLoading).toBe(true);
  });

  it("should return error when query fails", () => {
    const mockError = { message: "Failed to fetch earnings" };
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useEarnings());

    expect(result.current.error).toBe(mockError);
  });

  it("should configure retry to false", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderHook(() => useEarnings());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        retry: false,
      })
    );
  });
});

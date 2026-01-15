import { renderHook, act } from "@testing-library/react-native";
import { useRequestPasswordReset } from "../useRequestPasswordReset";
import { trpc } from "@lib/trpc/client";

const mockUseMutation = jest.fn();

describe("useRequestPasswordReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (trpc as any).auth = {
      requestPasswordReset: {
        useMutation: mockUseMutation,
      },
    };
  });

  it("should return initial state", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(typeof result.current.requestPasswordReset).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call mutation with correct email", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    await act(async () => {
      await result.current.requestPasswordReset("test@example.com");
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: "test@example.com" });
  });

  it("should handle mutation pending state", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(result.current.isPending).toBe(true);
  });

  it("should handle mutation error", () => {
    const mockError = { message: "Failed to send email" };

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    expect(result.current.error).toEqual(mockError);
  });

  it("should throw error when mutation fails", async () => {
    const mockError = new Error("Network error");
    const mockMutateAsync = jest.fn().mockRejectedValue(mockError);

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useRequestPasswordReset());

    await act(async () => {
      await expect(
        result.current.requestPasswordReset("test@example.com")
      ).rejects.toThrow("Network error");
    });
  });
});

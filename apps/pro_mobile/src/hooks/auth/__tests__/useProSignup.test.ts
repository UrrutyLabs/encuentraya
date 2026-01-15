import { renderHook, act } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { trpc } from "@lib/trpc/client";
import { useProSignup } from "../useProSignup";
import type { ProSignupInput } from "@repo/domain";

jest.mock("@lib/trpc/client");

const mockRouter = {
  replace: jest.fn(),
};

const mockUseMutation = jest.fn();

describe("useProSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup tRPC mocks
    (trpc as any).auth = {
      proSignup: {
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

    const { result } = renderHook(() => useProSignup());

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.signup).toBe("function");
  });

  it("should call mutation with correct input", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ email: "test@example.com" });
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useProSignup());

    const input: ProSignupInput = {
      email: "test@example.com",
      password: "password123",
    };

    await act(async () => {
      await result.current.signup(input);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(input);
  });

  it("should navigate to confirm-email screen on success", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ email: "test@example.com" });
    let onSuccessCallback: (data: { email: string }) => void;

    mockUseMutation.mockImplementation((options) => {
      onSuccessCallback = options.onSuccess;
      return {
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
      };
    });

    const { result } = renderHook(() => useProSignup());

    const input: ProSignupInput = {
      email: "test@example.com",
      password: "password123",
    };

    await act(async () => {
      await result.current.signup(input);
    });

    await act(() => {
      if (onSuccessCallback!) {
        onSuccessCallback({ email: "test@example.com" });
      }
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: "/auth/confirm-email",
      params: { email: "test@example.com" },
    });
  });

  it("should return isPending true when mutation is pending", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useProSignup());

    expect(result.current.isPending).toBe(true);
  });

  it("should return error from mutation", () => {
    const mockError = { message: "Email already exists" };
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useProSignup());

    expect(result.current.error).toBe(mockError);
  });

  it("should throw error when mutation fails", async () => {
    const mockError = new Error("Signup failed");
    const mockMutateAsync = jest.fn().mockRejectedValue(mockError);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useProSignup());

    const input: ProSignupInput = {
      email: "test@example.com",
      password: "password123",
    };

    await act(async () => {
      await expect(result.current.signup(input)).rejects.toThrow("Signup failed");
    });
  });
});

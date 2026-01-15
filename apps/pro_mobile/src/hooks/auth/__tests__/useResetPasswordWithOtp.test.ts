import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useResetPasswordWithOtp } from "../useResetPasswordWithOtp";
import { trpc } from "@lib/trpc/client";
import { useRouter } from "expo-router";

const mockRouter = {
  replace: jest.fn(),
};

const mockUseMutation = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockRouter),
}));

describe("useResetPasswordWithOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (trpc as any).auth = {
      resetPasswordWithOtp: {
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

    const { result } = renderHook(() => useResetPasswordWithOtp());

    expect(typeof result.current.resetPassword).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call mutation with correct email, otp, and password", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

    let onSuccessCallback: (() => void) | undefined;

    mockUseMutation.mockImplementation(
      (options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutateAsync: async (input: unknown) => {
            const result = await mockMutateAsync(input);
            onSuccessCallback?.();
            return result;
          },
          isPending: false,
          error: null,
        };
      }
    );

    const { result } = renderHook(() => useResetPasswordWithOtp());

    await act(async () => {
      await result.current.resetPassword(
        "test@example.com",
        "123456",
        "newPassword123"
      );
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: "test@example.com",
      otp: "123456",
      newPassword: "newPassword123",
    });
  });

  it("should redirect to login on success", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });

    let onSuccessCallback: (() => void) | undefined;

    mockUseMutation.mockImplementation(
      (options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutateAsync: async (input: unknown) => {
            const result = await mockMutateAsync(input);
            setTimeout(() => onSuccessCallback?.(), 0);
            return result;
          },
          isPending: false,
          error: null,
        };
      }
    );

    const { result } = renderHook(() => useResetPasswordWithOtp());

    await act(async () => {
      await result.current.resetPassword(
        "test@example.com",
        "123456",
        "newPassword123"
      );
    });

    await waitFor(
      () => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
      },
      { timeout: 2000 }
    );
  });

  it("should handle mutation pending state", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    });

    const { result } = renderHook(() => useResetPasswordWithOtp());

    expect(result.current.isPending).toBe(true);
  });

  it("should handle mutation error", () => {
    const mockError = { message: "Invalid OTP code" };

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      error: mockError,
    });

    const { result } = renderHook(() => useResetPasswordWithOtp());

    expect(result.current.error).toEqual(mockError);
  });

  it("should throw error when mutation fails", async () => {
    const mockError = new Error("Invalid OTP code");
    const mockMutateAsync = jest.fn().mockRejectedValue(mockError);

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });

    const { result } = renderHook(() => useResetPasswordWithOtp());

    await act(async () => {
      await expect(
        result.current.resetPassword(
          "test@example.com",
          "invalid-otp",
          "newPassword123"
        )
      ).rejects.toThrow("Invalid OTP code");
    });
  });
});

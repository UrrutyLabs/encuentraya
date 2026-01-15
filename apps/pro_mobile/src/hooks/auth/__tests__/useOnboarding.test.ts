import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../../shared/useQueryClient";
import { invalidateRelatedQueries } from "@lib/react-query/utils";
import { useOnboarding } from "../useOnboarding";
import { Category } from "@repo/domain";
import type { ProOnboardInput } from "@repo/domain";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useQueryClient");
jest.mock("@lib/react-query/utils");

const mockRouter = {
  replace: jest.fn(),
};

const mockQueryClient = {
  invalidateQueries: jest.fn(),
};

const mockUseMutation = jest.fn();

describe("useOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
    (invalidateRelatedQueries as jest.Mock).mockReturnValue({
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onSettled: jest.fn(),
    });

    // Setup tRPC mocks
    (trpc as any).pro = {
      convertToPro: {
        useMutation: mockUseMutation,
      },
    };
  });

  it("should return initial state", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.submitOnboarding).toBe("function");
  });

  it("should call mutation with correct input", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const { result } = renderHook(() => useOnboarding());

    const input: ProOnboardInput = {
      name: "John Doe",
      email: "john@example.com",
      phone: "123456789",
      hourlyRate: 50,
      categories: [Category.PLUMBING],
      serviceArea: "Montevideo",
    };

    await act(async () => {
      await result.current.submitOnboarding(input);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(input);
  });

  it("should clear error before submitting", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    const { result } = renderHook(() => useOnboarding());

    const input: ProOnboardInput = {
      name: "John Doe",
      email: "john@example.com",
      hourlyRate: 50,
      categories: [Category.PLUMBING],
    };

    await act(async () => {
      await result.current.submitOnboarding(input);
    });

    expect(result.current.error).toBe(null);
  });

  it("should navigate to home on success", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    let onSuccessCallback: () => void;

    mockUseMutation.mockImplementation((options) => {
      onSuccessCallback = options.onSuccess;
      return {
        mutateAsync: mockMutateAsync,
        isPending: false,
      };
    });

    const { result } = renderHook(() => useOnboarding());

    const input: ProOnboardInput = {
      name: "John Doe",
      email: "john@example.com",
      hourlyRate: 50,
      categories: [Category.PLUMBING],
    };

    await act(async () => {
      await result.current.submitOnboarding(input);
    });

    await act(() => {
      if (onSuccessCallback!) {
        onSuccessCallback();
      }
    });

    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("should set error message on mutation error", async () => {
    const errorMessage = "Failed to create profile";
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error(errorMessage));
    let onErrorCallback: (err: Error) => void;

    mockUseMutation.mockImplementation((options) => {
      onErrorCallback = options.onError;
      return {
        mutateAsync: mockMutateAsync,
        isPending: false,
      };
    });

    const { result } = renderHook(() => useOnboarding());

    const input: ProOnboardInput = {
      name: "John Doe",
      email: "john@example.com",
      hourlyRate: 50,
      categories: [Category.PLUMBING],
    };

    await act(async () => {
      try {
        await result.current.submitOnboarding(input);
      } catch {
        // Error expected
      }
    });

    await act(() => {
      if (onErrorCallback!) {
        onErrorCallback(new Error(errorMessage));
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it("should use default error message when error has no message", async () => {
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error());
    let onErrorCallback: (err: Error) => void;

    mockUseMutation.mockImplementation((options) => {
      onErrorCallback = options.onError;
      return {
        mutateAsync: mockMutateAsync,
        isPending: false,
      };
    });

    const { result } = renderHook(() => useOnboarding());

    const input: ProOnboardInput = {
      name: "John Doe",
      email: "john@example.com",
      hourlyRate: 50,
      categories: [Category.PLUMBING],
    };

    await act(async () => {
      try {
        await result.current.submitOnboarding(input);
      } catch {
        // Error expected
      }
    });

    await act(() => {
      if (onErrorCallback!) {
        onErrorCallback(new Error());
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Error al crear perfil de profesional");
    });
  });

  it("should return isPending true when mutation is pending", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.isLoading).toBe(true);
  });

  it("should invalidate related queries on success", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderHook(() => useOnboarding());

    expect(invalidateRelatedQueries).toHaveBeenCalledWith(mockQueryClient, [
      [["pro", "getMyProfile"]],
      [["auth", "me"]],
    ]);
  });
});

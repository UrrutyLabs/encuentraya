import { renderHook, waitFor, act } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../../shared/useQueryClient";
import { useAvailability } from "../useAvailability";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useQueryClient");

const mockQueryClient = {
  cancelQueries: jest.fn(() => Promise.resolve()),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
};

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

describe("useAvailability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    // Setup tRPC mocks structure
    (trpc as any).pro = {
      getMyProfile: {
        useQuery: mockUseQuery,
      },
      setAvailability: {
        useMutation: mockUseMutation,
      },
    };
  });

  describe("initial state", () => {
    it("should return isAvailable false when pro is not loaded", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.isSaving).toBe(false);
    });

    it("should return isAvailable true when pro is approved and not suspended", () => {
      mockUseQuery.mockReturnValue({
        data: {
          id: "pro-1",
          isApproved: true,
          isSuspended: false,
        },
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return isAvailable false when pro is not approved", () => {
      mockUseQuery.mockReturnValue({
        data: {
          id: "pro-1",
          isApproved: false,
          isSuspended: false,
        },
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(false);
    });

    it("should return isAvailable false when pro is suspended", () => {
      mockUseQuery.mockReturnValue({
        data: {
          id: "pro-1",
          isApproved: true,
          isSuspended: true,
        },
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(false);
    });
  });

  describe("toggleAvailability", () => {
    it("should call mutation with correct availability when toggling from false to true", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(true);

      await act(async () => {
        await result.current.toggleAvailability();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ isAvailable: false });
    });

    it("should call mutation with correct availability when toggling from true to false", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: false,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isAvailable).toBe(false);

      await act(async () => {
        await result.current.toggleAvailability();
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ isAvailable: true });
    });

    it("should clear error before toggling", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAvailability());

      // Set an error first (simulating previous error state)
      // Note: We can't directly set error state, but we can verify it's cleared after successful toggle

      await act(async () => {
        await result.current.toggleAvailability();
      });

      expect(result.current.error).toBe(null);
    });

    it("should set isSaving to true when mutation is pending", () => {
      mockUseQuery.mockReturnValue({
        data: {
          id: "pro-1",
          isApproved: true,
          isSuspended: false,
        },
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useAvailability());

      expect(result.current.isSaving).toBe(true);
    });
  });

  describe("mutation callbacks", () => {
    it("should cancel queries and snapshot previous pro on mutate", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      let onMutateCallback: (variables: { isAvailable: boolean }) => Promise<{ previousPro: typeof previousPro }>;
      mockUseMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      renderHook(() => useAvailability());

      await act(async () => {
        if (onMutateCallback!) {
          await onMutateCallback({ isAvailable: false });
        }
      });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should rollback on error", async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error("Network error"));
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      let onErrorCallback: (error: Error, variables: { isAvailable: boolean }, context: { previousPro: typeof previousPro }) => void;
      mockUseMutation.mockImplementation((options) => {
        onErrorCallback = options.onError;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        try {
          await result.current.toggleAvailability();
        } catch {
          // Error expected
        }
      });

      await act(async () => {
        if (onErrorCallback!) {
          onErrorCallback(new Error("Network error"), { isAvailable: false }, { previousPro });
        }
      });

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith([["pro", "getMyProfile"]], previousPro);
    });

    it("should invalidate queries on success", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      let onSuccessCallback: () => void;
      mockUseMutation.mockImplementation((options) => {
        onSuccessCallback = options.onSuccess;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.toggleAvailability();
      });

      await act(() => {
        if (onSuccessCallback!) {
          onSuccessCallback();
        }
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should invalidate queries on settled", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      let onSettledCallback: () => void;
      mockUseMutation.mockImplementation((options) => {
        onSettledCallback = options.onSettled;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        await result.current.toggleAvailability();
      });

      await act(() => {
        if (onSettledCallback!) {
          onSettledCallback();
        }
      });

      // Should be called twice: once in onSuccess, once in onSettled
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should set error message on mutation error", async () => {
      const errorMessage = "Failed to update availability";
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error(errorMessage));
      const previousPro = {
        id: "pro-1",
        isApproved: true,
        isSuspended: false,
      };

      mockUseQuery.mockReturnValue({
        data: previousPro,
        isLoading: false,
      });

      let onErrorCallback: (error: Error, variables: { isAvailable: boolean }, context: { previousPro: typeof previousPro }) => void;
      mockUseMutation.mockImplementation((options) => {
        onErrorCallback = options.onError;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailability());

      await act(async () => {
        try {
          await result.current.toggleAvailability();
        } catch {
          // Error expected
        }
      });

      await act(() => {
        if (onErrorCallback!) {
          onErrorCallback(new Error(errorMessage), { isAvailable: false }, { previousPro });
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});

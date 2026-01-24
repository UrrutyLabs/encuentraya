import { renderHook, waitFor, act } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../../shared/useQueryClient";
import { useAvailabilitySlots } from "../useAvailabilitySlots";
import type { AvailabilitySlot } from "@repo/domain";

jest.mock("@lib/trpc/client");
jest.mock("../../shared/useQueryClient");

const mockQueryClient = {
  cancelQueries: jest.fn(() => Promise.resolve()),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  getQueryData: jest.fn(),
};

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

describe("useAvailabilitySlots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    // Setup tRPC mocks structure
    (trpc as any).pro = {
      getAvailabilitySlots: {
        useQuery: mockUseQuery,
      },
      updateAvailabilitySlots: {
        useMutation: mockUseMutation,
      },
    };
  });

  describe("initial state", () => {
    it("should return empty slots array when loading", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      expect(result.current.slots).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.isSaving).toBe(false);
    });

    it("should return slots when loaded", () => {
      const mockSlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "slot-2",
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUseQuery.mockReturnValue({
        data: mockSlots,
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      expect(result.current.slots).toEqual(mockSlots);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("updateSlots", () => {
    it("should call mutation with correct slots", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue([
        {
          id: "slot-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      const newSlots = [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
        },
      ];

      await act(async () => {
        await result.current.updateSlots(newSlots);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({ slots: newSlots });
    });

    it("should clear error before updating", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue([]);

      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      await act(async () => {
        await result.current.updateSlots([]);
      });

      expect(result.current.error).toBe(null);
    });

    it("should set isSaving to true when mutation is pending", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      mockUseMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      expect(result.current.isSaving).toBe(true);
    });
  });

  describe("mutation callbacks", () => {
    it("should cancel queries and optimistically update on mutate", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue([]);
      const previousSlots: AvailabilitySlot[] = [];

      mockUseQuery.mockReturnValue({
        data: previousSlots,
        isLoading: false,
      });

      let onMutateCallback: (variables: {
        slots: { dayOfWeek: number; startTime: string; endTime: string }[];
      }) => Promise<{ previousSlots: AvailabilitySlot[]; previousPro: any }>;
      mockUseMutation.mockImplementation((options) => {
        onMutateCallback = options.onMutate;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      renderHook(() => useAvailabilitySlots());

      await act(async () => {
        if (onMutateCallback!) {
          await onMutateCallback({
            slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
          });
        }
      });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getAvailabilitySlots"]],
      });
      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should rollback on error", async () => {
      const mockMutateAsync = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      const previousSlots: AvailabilitySlot[] = [
        {
          id: "slot-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const previousPro = { id: "pro-1", isAvailable: true };

      mockUseQuery.mockReturnValue({
        data: previousSlots,
        isLoading: false,
      });

      mockQueryClient.getQueryData.mockReturnValue(previousPro);

      let onErrorCallback: (
        error: Error,
        variables: any,
        context: { previousSlots: AvailabilitySlot[]; previousPro: any }
      ) => void;
      mockUseMutation.mockImplementation((options) => {
        onErrorCallback = options.onError;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      await act(async () => {
        try {
          await result.current.updateSlots([]);
        } catch {
          // Error expected
        }
      });

      await act(async () => {
        if (onErrorCallback!) {
          onErrorCallback(
            new Error("Network error"),
            { slots: [] },
            { previousSlots, previousPro }
          );
        }
      });

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        [["pro", "getAvailabilitySlots"]],
        previousSlots
      );
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        [["pro", "getMyProfile"]],
        previousPro
      );
    });

    it("should update with server response on success", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue([
        {
          id: "slot-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      let onSuccessCallback: (data: AvailabilitySlot[]) => void;
      mockUseMutation.mockImplementation((options) => {
        onSuccessCallback = options.onSuccess;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      await act(async () => {
        await result.current.updateSlots([
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
        ]);
      });

      await act(() => {
        if (onSuccessCallback!) {
          onSuccessCallback([
            {
              id: "slot-1",
              dayOfWeek: 1,
              startTime: "09:00",
              endTime: "17:00",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]);
        }
      });

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        [["pro", "getAvailabilitySlots"]],
        expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "17:00",
          }),
        ])
      );
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should invalidate queries on settled", async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue([]);

      mockUseQuery.mockReturnValue({
        data: [],
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

      const { result } = renderHook(() => useAvailabilitySlots());

      await act(async () => {
        await result.current.updateSlots([]);
      });

      await act(() => {
        if (onSettledCallback!) {
          onSettledCallback();
        }
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getAvailabilitySlots"]],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [["pro", "getMyProfile"]],
      });
    });

    it("should set error message on mutation error", async () => {
      const errorMessage = "Failed to update availability slots";
      const mockMutateAsync = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      const previousSlots: AvailabilitySlot[] = [];
      const previousPro = { id: "pro-1", isAvailable: false };

      mockUseQuery.mockReturnValue({
        data: previousSlots,
        isLoading: false,
      });

      mockQueryClient.getQueryData.mockReturnValue(previousPro);

      let onErrorCallback: (
        error: Error,
        variables: any,
        context: { previousSlots: AvailabilitySlot[]; previousPro: any }
      ) => void;
      mockUseMutation.mockImplementation((options) => {
        onErrorCallback = options.onError;
        return {
          mutateAsync: mockMutateAsync,
          isPending: false,
        };
      });

      const { result } = renderHook(() => useAvailabilitySlots());

      await act(async () => {
        try {
          await result.current.updateSlots([]);
        } catch {
          // Error expected
        }
      });

      await act(() => {
        if (onErrorCallback!) {
          onErrorCallback(
            new Error(errorMessage),
            { slots: [] },
            { previousSlots, previousPro }
          );
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});

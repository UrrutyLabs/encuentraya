import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeleteAccount } from "../useDeleteAccount";
import { mockTrpcAuthDeleteAccount } from "@/test-setup";

// Mock useAuth
const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("../useAuth", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

// Mock useRouter
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("useDeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with empty password", () => {
      mockTrpcAuthDeleteAccount.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useDeleteAccount());

      expect(result.current.password).toBe("");
    });
  });

  describe("password state updates", () => {
    it("should update password", () => {
      mockTrpcAuthDeleteAccount.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useDeleteAccount());

      act(() => {
        result.current.setPassword("password123");
      });

      expect(result.current.password).toBe("password123");
    });
  });

  describe("account deletion", () => {
    it("should call mutation with password on submit", () => {
      const mockMutate = vi.fn();

      mockTrpcAuthDeleteAccount.mockImplementation(() => ({
        mutate: mockMutate,
        isPending: false,
        error: null,
      }));

      const { result } = renderHook(() => useDeleteAccount());

      act(() => {
        result.current.setPassword("password123");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleDelete(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalledWith({
        password: "password123",
      });
    });

    it("should sign out and redirect to home on success", async () => {
      let onSuccessCallback: (() => void) | undefined;

      mockTrpcAuthDeleteAccount.mockImplementation(
        (options?: { onSuccess?: () => void }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Test mock, input not needed
            mutate: (_input: unknown) => {
              // Call onSuccess synchronously after mutate is called
              setTimeout(() => {
                onSuccessCallback?.();
              }, 0);
            },
            isPending: false,
            error: null,
          };
        }
      );

      const { result } = renderHook(() => useDeleteAccount());

      act(() => {
        result.current.setPassword("password123");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        result.current.handleDelete(mockEvent);
        // Wait for onSuccess to be called
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcAuthDeleteAccount.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useDeleteAccount());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Account deletion failed");

      mockTrpcAuthDeleteAccount.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: mockError,
      }));

      const { result } = renderHook(() => useDeleteAccount());

      expect(result.current.error).toEqual(mockError);
    });
  });
});

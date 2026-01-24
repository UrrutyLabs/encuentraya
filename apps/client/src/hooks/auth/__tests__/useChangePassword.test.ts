import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "../useChangePassword";
import {
  mockTrpcAuthChangePassword,
  mockSignOut,
  mockQueryClient,
} from "@/test-setup";

// Add resetQueries to the mockQueryClient from test-setup
const mockResetQueries = vi.fn();
const mockInvalidateQueries = vi.fn();

// Override the mock to include resetQueries
vi.mock("@/hooks/shared/useQueryClient", () => ({
  useQueryClient: () => ({
    ...mockQueryClient,
    resetQueries: mockResetQueries,
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Supabase client is already mocked in test-setup.ts
// auth-utils will use the mocked supabase, so we don't need to mock it separately

// Mock window.location.href - use getter/setter to track assignments
let locationHrefValue = "";
Object.defineProperty(window, "location", {
  value: {
    get href() {
      return locationHrefValue;
    },
    set href(value: string) {
      locationHrefValue = value;
    },
  },
  writable: true,
  configurable: true,
});

describe("useChangePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks
    mockResetQueries.mockClear();
    mockInvalidateQueries.mockClear();
    mockSignOut.mockClear();
    // Reset window.location.href
    locationHrefValue = "";
    // Reset signOut to return success
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe("initial state", () => {
    it("should initialize with empty password fields", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      expect(result.current.currentPassword).toBe("");
      expect(result.current.newPassword).toBe("");
      expect(result.current.confirmPassword).toBe("");
    });
  });

  describe("form state updates", () => {
    it("should update currentPassword", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setCurrentPassword("oldpass123");
      });

      expect(result.current.currentPassword).toBe("oldpass123");
    });

    it("should update newPassword", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setNewPassword("newpass123");
      });

      expect(result.current.newPassword).toBe("newpass123");
    });

    it("should update confirmPassword", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setConfirmPassword("newpass123");
      });

      expect(result.current.confirmPassword).toBe("newpass123");
    });
  });

  describe("form submission", () => {
    it("should call mutation when passwords match", () => {
      const mockMutate = vi.fn();

      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: mockMutate,
        isPending: false,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setCurrentPassword("oldpass123");
        result.current.setNewPassword("newpass123");
        result.current.setConfirmPassword("newpass123");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalledWith({
        currentPassword: "oldpass123",
        newPassword: "newpass123",
      });
    });

    it("should not call mutation when passwords do not match", () => {
      const mockMutate = vi.fn();
      const mockReset = vi.fn();

      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: mockMutate,
        isPending: false,
        error: null,
        isSuccess: false,
        reset: mockReset,
      }));

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setCurrentPassword("oldpass123");
        result.current.setNewPassword("newpass123");
        result.current.setConfirmPassword("differentpass");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockMutate).not.toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
    });

    it("should clear cache, sign out, and redirect on success", async () => {
      let onSuccessCallback: (() => Promise<void>) | undefined;

      mockTrpcAuthChangePassword.mockImplementation(
        (options?: { onSuccess?: () => Promise<void> }) => {
          onSuccessCallback = options?.onSuccess;
          return {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Test mock, input not needed
            mutate: async (_input: unknown) => {
              // Call onSuccess asynchronously after mutate is called
              if (onSuccessCallback) {
                await onSuccessCallback();
              }
            },
            isPending: false,
            error: null,
            isSuccess: true,
            reset: vi.fn(),
          };
        }
      );

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.setCurrentPassword("oldpass123");
        result.current.setNewPassword("newpass123");
        result.current.setConfirmPassword("newpass123");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        result.current.handleSubmit(mockEvent);
        // Wait for async operations to complete
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify cache clearing
      expect(mockResetQueries).toHaveBeenCalledWith({
        queryKey: [["auth", "me"]],
      });
      expect(mockInvalidateQueries).toHaveBeenCalled();

      // clearSessionStorage is called but we don't verify it
      // as it just clears localStorage and doesn't need to be mocked

      // Verify sign out
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });

      // Verify redirect using window.location.href (assignment, not function call)
      expect(locationHrefValue).toBe("/login?passwordChanged=true");
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: true,
        error: null,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Password change failed");

      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: mockError,
        isSuccess: false,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      expect(result.current.error).toEqual(mockError);
    });

    it("should return isSuccess state", () => {
      mockTrpcAuthChangePassword.mockImplementation(() => ({
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: true,
        reset: vi.fn(),
      }));

      const { result } = renderHook(() => useChangePassword());

      expect(result.current.isSuccess).toBe(true);
    });
  });
});

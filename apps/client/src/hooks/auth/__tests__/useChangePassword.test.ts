import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "../useChangePassword";
import { mockTrpcAuthChangePassword } from "@/test-setup";

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

describe("useChangePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it("should sign out and redirect on success", async () => {
      let onSuccessCallback: (() => void) | undefined;

      mockTrpcAuthChangePassword.mockImplementation((options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
        return {
          mutate: (input: unknown) => {
            // Call onSuccess synchronously after mutate is called
            setTimeout(() => {
              onSuccessCallback?.();
            }, 0);
          },
          isPending: false,
          error: null,
          isSuccess: true,
          reset: vi.fn(),
        };
      });

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
        // Wait for onSuccess to be called
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/login?passwordChanged=true");
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

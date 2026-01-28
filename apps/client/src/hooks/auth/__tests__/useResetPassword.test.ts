import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useResetPassword } from "../useResetPassword";
import { mockGetSession, mockUpdateUser } from "@/test-setup";
import { Role } from "@repo/domain";

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

// Mock useAuth
const mockUser = { id: "user-1", email: "test@example.com" };
vi.mock("../useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    session: { user: mockUser },
    loading: false,
  }),
}));

// Mock useUserRole - will be overridden in specific tests
const mockUseUserRole = vi.fn(() => ({
  role: Role.CLIENT,
  isLoading: false,
}));

vi.mock("../useUserRole", () => ({
  useUserRole: () => mockUseUserRole(),
}));

describe("useResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useUserRole mock to default CLIENT role
    mockUseUserRole.mockReturnValue({
      role: Role.CLIENT,
      isLoading: false,
    });
    // Default: recovery session exists
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: "recovery-token",
        },
      },
      error: null,
    });
  });

  it("should return initial state", async () => {
    const { result } = renderHook(() => useResetPassword());

    expect(typeof result.current.resetPassword).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();

    // Wait for useEffect to complete
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });
  });

  it("should check for recovery session on mount", async () => {
    renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
    });
  });

  it("should update password successfully with recovery session", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(true);
    });

    await act(async () => {
      await result.current.resetPassword("newPassword123");
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "newPassword123",
    });
  });

  it("should redirect to my-jobs for CLIENT role after success", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(true);
    });

    await act(async () => {
      await result.current.resetPassword("newPassword123");
    });

    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith("/my-jobs");
      },
      { timeout: 2000 }
    );
  });

  it("should redirect to pro/download-app for PRO role after success", async () => {
    // Override useUserRole mock for this test
    mockUseUserRole.mockReturnValue({
      role: Role.PRO,
      isLoading: false,
    });

    mockUpdateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(true);
    });

    await act(async () => {
      await result.current.resetPassword("newPassword123");
    });

    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith("/pro/download-app");
      },
      { timeout: 2000 }
    );
  });

  it("should handle error when no recovery session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.resetPassword("newPassword123")
      ).rejects.toThrow();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("should handle updateUser error", async () => {
    const mockError = {
      message: "Password update failed",
      status: 400,
    };

    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(true);
    });

    await act(async () => {
      await expect(
        result.current.resetPassword("newPassword123")
      ).rejects.toThrow();
    });

    expect(result.current.error).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should set pending state during password update", async () => {
    let resolveUpdate: (value: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });

    mockUpdateUser.mockReturnValue(updatePromise);

    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => {
      expect(result.current.hasRecoverySession).toBe(true);
    });

    act(() => {
      result.current.resetPassword("newPassword123");
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveUpdate!({
        data: { user: mockUser },
        error: null,
      });
      await updatePromise;
    });

    expect(result.current.isPending).toBe(false);
  });
});

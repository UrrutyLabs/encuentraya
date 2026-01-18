import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActionGuard } from "../useActionGuard";
import { Role } from "@repo/domain";

// Mock useAuthState
const mockUseAuthState = vi.fn();

vi.mock("../useAuthState", () => ({
  useAuthState: () => mockUseAuthState(),
}));

// Mock performAuthRedirect
vi.mock("@/lib/auth/redirect-helpers", () => ({
  performAuthRedirect: vi.fn(),
}));

// Import after mock to get the mocked function
import { performAuthRedirect as mockPerformAuthRedirect } from "@/lib/auth/redirect-helpers";

describe("useActionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useAuthState - not authenticated, not loading
    mockUseAuthState.mockReturnValue({
      user: null,
      role: null,
      isLoading: false,
      roleError: null,
      isAuthenticated: false,
    });
  });

  describe("when user is authenticated", () => {
    it("should execute callback when user is authenticated", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useActionGuard());

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2");
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should handle multiple arguments", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useActionGuard());

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback("arg1", "arg2", "arg3", 123);

      expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2", "arg3", 123);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should execute callback when role matches requiredRole", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useActionGuard({ requiredRole: Role.CLIENT })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback();

      expect(mockCallback).toHaveBeenCalled();
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });
  });

  describe("when user is not authenticated", () => {
    it("should not execute callback and redirect to login", () => {
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useActionGuard());

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/login");
    });

    it("should redirect to custom redirectTo", () => {
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() =>
        useActionGuard({ redirectTo: "/custom-login" })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/custom-login");
    });

    it("should redirect with returnUrl when callback is blocked", () => {
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() =>
        useActionGuard({ returnUrl: "/protected" })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalledWith(
        "/login?returnUrl=%2Fprotected"
      );
    });
  });

  describe("when auth is loading", () => {
    it("should not execute callback when loading", () => {
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: true,
        roleError: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useActionGuard());

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });
  });

  describe("role-based authentication", () => {
    it("should not execute callback when role does not match", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useActionGuard({ requiredRole: Role.PRO })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalled();
    });

    it("should redirect to /pro/download-app when PRO user tries CLIENT action", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.PRO,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useActionGuard({ requiredRole: Role.CLIENT })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/pro/download-app");
    });

    it("should redirect to /my-bookings when CLIENT user tries PRO action", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useActionGuard({ requiredRole: Role.PRO })
      );

      const wrappedCallback = result.current(mockCallback);

      wrappedCallback();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/my-bookings");
    });
  });
});

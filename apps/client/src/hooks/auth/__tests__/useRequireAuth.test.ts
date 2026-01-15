import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRequireAuth } from "../useRequireAuth";
import { Role } from "@repo/domain";

// Mock useAuth
const mockUseAuth = vi.fn();

vi.mock("../useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useUserRole
const mockUseUserRole = vi.fn();

vi.mock("../useUserRole", () => ({
  useUserRole: () => mockUseUserRole(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
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

describe("useRequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useUserRole - no role, not loading
    mockUseUserRole.mockReturnValue({
      role: null,
      isLoading: false,
      error: null,
    });
  });

  describe("when user is authenticated", () => {
    it("should return isAuthenticated true", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should execute callback when requireAuth wrapper is used", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2");
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe("when user is not authenticated", () => {
    it("should redirect to default login page", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireAuth());

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/login");
      });
    });

    it("should redirect to custom redirectTo", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireAuth({ redirectTo: "/custom-login" }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/custom-login");
      });
    });

    it("should include returnUrl in redirect", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      renderHook(() =>
        useRequireAuth({ redirectTo: "/login", returnUrl: "/protected" })
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          "/login?returnUrl=%2Fprotected"
        );
      });
    });

    it("should not execute callback when requireAuth wrapper is used", () => {
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });
  });

  describe("when auth is loading", () => {
    it("should return isLoading true", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should not execute callback when loading", () => {
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should redirect after loading completes and user is null", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { rerender } = renderHook(() => useRequireAuth());

      // Simulate loading completing
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      rerender();

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("requireAuth wrapper", () => {
    it("should handle multiple arguments", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireAuth());

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback("arg1", "arg2", "arg3", 123);

      expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2", "arg3", 123);
    });

    it("should redirect with returnUrl when callback is blocked", () => {
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useRequireAuth({ returnUrl: "/protected" })
      );

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/login?returnUrl=%2Fprotected"
      );
    });
  });

  describe("role-based authentication", () => {
    it("should return isAuthenticated true when role matches", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.CLIENT,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useRequireAuth({ requiredRole: Role.CLIENT })
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("should redirect when role does not match - PRO accessing CLIENT route", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.PRO,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireAuth({ requiredRole: Role.CLIENT }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/pro/download-app");
      });
    });

    it("should redirect when role does not match - CLIENT accessing PRO route", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.CLIENT,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireAuth({ requiredRole: Role.PRO }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/my-bookings");
      });
    });

    it("should return isAuthenticated false when role does not match", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.CLIENT,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useRequireAuth({ requiredRole: Role.PRO })
      );

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should not execute callback when role does not match", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockCallback = vi.fn();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.CLIENT,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useRequireAuth({ requiredRole: Role.PRO })
      );

      const wrappedCallback = result.current.requireAuth(mockCallback);

      wrappedCallback("arg1", "arg2");

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it("should wait for role to load before redirecting", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() =>
        useRequireAuth({ requiredRole: Role.CLIENT })
      );

      expect(result.current.isLoading).toBe(true);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});

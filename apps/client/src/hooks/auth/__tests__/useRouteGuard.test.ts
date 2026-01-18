import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRouteGuard } from "../useRouteGuard";
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

describe("useRouteGuard", () => {
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
    it("should return isAuthenticated true", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useRouteGuard());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should return isAuthenticated true when role matches requiredRole", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useRouteGuard({ requiredRole: Role.CLIENT })
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });
  });

  describe("when user is not authenticated", () => {
    it("should redirect to default login page", async () => {
      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      renderHook(() => useRouteGuard());

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/login");
      });
    });

    it("should redirect to custom redirectTo", async () => {
      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      renderHook(() => useRouteGuard({ redirectTo: "/custom-login" }));

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/custom-login");
      });
    });

    it("should include returnUrl in redirect", async () => {
      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      renderHook(() =>
        useRouteGuard({ redirectTo: "/login", returnUrl: "/protected" })
      );

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith(
          "/login?returnUrl=%2Fprotected"
        );
      });
    });
  });

  describe("when auth is loading", () => {
    it("should return isLoading true", () => {
      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: true,
        roleError: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useRouteGuard());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should redirect after loading completes and user is null", async () => {
      const { rerender } = renderHook(() => useRouteGuard());

      // Simulate loading completing
      mockUseAuthState.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        roleError: null,
        isAuthenticated: false,
      });

      rerender();

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("role-based authentication", () => {
    it("should return isAuthenticated true when role matches", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useRouteGuard({ requiredRole: Role.CLIENT })
      );

      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should redirect when role does not match - PRO accessing CLIENT route", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.PRO,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      renderHook(() => useRouteGuard({ requiredRole: Role.CLIENT }));

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/pro/download-app");
      });
    });

    it("should redirect when role does not match - CLIENT accessing PRO route", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      renderHook(() => useRouteGuard({ requiredRole: Role.PRO }));

      await waitFor(() => {
        expect(mockPerformAuthRedirect).toHaveBeenCalledWith("/my-bookings");
      });
    });

    it("should return isAuthenticated false when role does not match", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: Role.CLIENT,
        isLoading: false,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useRouteGuard({ requiredRole: Role.PRO })
      );

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should wait for role to load before redirecting", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: null,
        isLoading: true,
        roleError: null,
        isAuthenticated: true,
      });

      const { result } = renderHook(() =>
        useRouteGuard({ requiredRole: Role.CLIENT })
      );

      expect(result.current.isLoading).toBe(true);
      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });

    it("should not redirect on network errors when fetching role", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const networkError = new Error("Failed to fetch");

      mockUseAuthState.mockReturnValue({
        user: mockUser,
        role: null,
        isLoading: false,
        roleError: networkError,
        isAuthenticated: true,
      });

      renderHook(() => useRouteGuard({ requiredRole: Role.CLIENT }));

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockPerformAuthRedirect).not.toHaveBeenCalled();
    });
  });
});

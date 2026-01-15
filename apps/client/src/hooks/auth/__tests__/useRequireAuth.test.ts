import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRequireAuth } from "../useRequireAuth";

// Mock useAuth
const mockUseAuth = vi.fn();

vi.mock("../useAuth", () => ({
  useAuth: () => mockUseAuth(),
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
  });

  describe("when user is authenticated", () => {
    it("should return isAuthenticated true", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
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

      const { rerender } = renderHook(() => useRequireAuth());

      // Simulate loading completing
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
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
});

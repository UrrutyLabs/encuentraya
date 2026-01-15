import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useClientAuth } from "../useClientAuth";
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

describe("useClientAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useUserRole - CLIENT role, not loading
    mockUseUserRole.mockReturnValue({
      role: Role.CLIENT,
      isLoading: false,
      error: null,
    });
  });

  describe("when user is authenticated", () => {
    it("should redirect to /my-bookings when user exists with CLIENT role", async () => {
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

      renderHook(() => useClientAuth());

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/my-bookings");
      });
    });

    it("should redirect to /pro/download-app when user exists with PRO role", async () => {
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

      renderHook(() => useClientAuth());

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/pro/download-app");
      });
    });

    it("should not redirect while auth is loading", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: true,
      });

      renderHook(() => useClientAuth());

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("should not redirect while role is loading", () => {
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

      renderHook(() => useClientAuth());

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("should redirect after loading completes", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { rerender } = renderHook(() => useClientAuth());

      // Simulate loading completing with user
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: Role.CLIENT,
        isLoading: false,
        error: null,
      });

      rerender();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/my-bookings");
      });
    });
  });

  describe("when user is not authenticated", () => {
    it("should not redirect when user is null", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderHook(() => useClientAuth());

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("should not redirect while loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      renderHook(() => useClientAuth());

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("should return isLoading true when auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useClientAuth());

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading true when user exists and role is loading", () => {
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

      const { result } = renderHook(() => useClientAuth());

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when auth is not loading and no user", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      mockUseUserRole.mockReturnValue({
        role: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useClientAuth());

      // When user is null, (user && isLoadingRole) evaluates to null (not false)
      // So false || null = null, which is falsy. We test for falsy value.
      expect(result.current.isLoading).toBeFalsy();
    });

    it("should return isLoading false when user exists and role is loaded", () => {
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

      const { result } = renderHook(() => useClientAuth());

      expect(result.current.isLoading).toBe(false);
    });
  });
});

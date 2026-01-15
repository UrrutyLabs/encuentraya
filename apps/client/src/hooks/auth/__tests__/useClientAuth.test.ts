import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useClientAuth } from "../useClientAuth";

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

describe("useClientAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is authenticated", () => {
    it("should redirect to /search when user exists", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      renderHook(() => useClientAuth());

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/search");
      });
    });

    it("should not redirect while loading", () => {
      const mockUser = { id: "user-1", email: "test@example.com" };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: true,
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

      const { rerender } = renderHook(() => useClientAuth());

      // Simulate loading completing with user
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      rerender();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith("/search");
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

      const { result } = renderHook(() => useClientAuth());

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when auth is not loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useClientAuth());

      expect(result.current.isLoading).toBe(false);
    });
  });
});

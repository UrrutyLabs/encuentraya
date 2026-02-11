import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useClientProfile } from "../useClientProfile";
import { mockTrpcClientProfileGet } from "@/test-setup";

describe("useClientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when profile is loaded", () => {
    it("should return profile data when query succeeds", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as const,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useClientProfile());

      expect(mockTrpcClientProfileGet).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          retry: false,
        })
      );

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should return profile with null phone when phone is not set", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: null,
        preferredContactMethod: "EMAIL" as const,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useClientProfile());

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.profile?.phone).toBeNull();
    });
  });

  describe("loading state", () => {
    it("should return loading state when data is loading", () => {
      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useClientProfile());

      expect(result.current.profile).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  describe("error state", () => {
    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch profile");

      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useClientProfile());

      expect(result.current.profile).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("query configuration", () => {
    it("should set retry to false", () => {
      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useClientProfile());

      expect(mockTrpcClientProfileGet).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          retry: false,
        })
      );
    });

    it("should pass undefined as query input", () => {
      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useClientProfile());

      expect(mockTrpcClientProfileGet).toHaveBeenCalledWith(
        undefined,
        expect.any(Object)
      );
    });
  });
});

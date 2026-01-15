import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsForm } from "../useSettingsForm";
import {
  mockTrpcClientProfileGet,
  mockTrpcClientProfileUpdate,
} from "@/test-setup";
import { PreferredContactMethod } from "@repo/domain";

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

describe("useSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize form with profile data when profile is loaded", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.phone).toBe("+59812345678");
      expect(result.current.preferredContactMethod).toBe("WHATSAPP");
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });

    it("should initialize form with empty values when profile has no phone", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: null,
        preferredContactMethod: "EMAIL" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.phone).toBe("");
      expect(result.current.preferredContactMethod).toBe("EMAIL");
    });

    it("should initialize form with empty values when profile is undefined", () => {
      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.phone).toBe("");
      expect(result.current.preferredContactMethod).toBe("");
    });
  });

  describe("form state updates", () => {
    it("should update phone when setPhone is called", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      act(() => {
        result.current.setPhone("+59898765432");
      });

      expect(result.current.phone).toBe("+59898765432");
    });

    it("should update preferredContactMethod when setPreferredContactMethod is called", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      act(() => {
        result.current.setPreferredContactMethod("EMAIL");
      });

      expect(result.current.preferredContactMethod).toBe("EMAIL");
    });

    it("should sync form state when profile changes", () => {
      const initialProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: initialProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result, rerender } = renderHook(() => useSettingsForm());

      // Change form values
      act(() => {
        result.current.setPhone("+59899999999");
        result.current.setPreferredContactMethod("EMAIL");
      });

      // Update profile
      const updatedProfile = {
        ...initialProfile,
        phone: "+59811111111",
        preferredContactMethod: "SMS" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: updatedProfile,
        isLoading: false,
        error: null,
      });

      rerender();

      // Form should sync with new profile values
      expect(result.current.phone).toBe("+59811111111");
      expect(result.current.preferredContactMethod).toBe("SMS");
    });
  });

  describe("form submission", () => {
    it("should call mutation with form values on submit", async () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const mockMutate = vi.fn();
      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      act(() => {
        result.current.setPhone("+59898765432");
        result.current.setPreferredContactMethod("EMAIL");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalledWith({
        phone: "+59898765432",
        preferredContactMethod: "EMAIL",
      });
    });

    it("should convert empty phone to null", async () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const mockMutate = vi.fn();
      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      act(() => {
        result.current.setPhone("");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockMutate).toHaveBeenCalledWith({
        phone: null,
        preferredContactMethod: "WHATSAPP",
      });
    });

    it("should convert empty preferredContactMethod to null", async () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const mockMutate = vi.fn();
      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      act(() => {
        result.current.setPreferredContactMethod("");
      });

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent;

      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(mockMutate).toHaveBeenCalledWith({
        phone: "+59812345678",
        preferredContactMethod: null,
      });
    });
  });

  describe("mutation state", () => {
    it("should return isPending state from mutation", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state from mutation", () => {
      const mockProfile = {
        id: "client-1",
        email: "client@example.com",
        phone: "+59812345678",
        preferredContactMethod: "WHATSAPP" as PreferredContactMethod,
      };

      mockTrpcClientProfileGet.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
      });

      const mockError = new Error("Update failed");

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("loading state", () => {
    it("should return loading state when profile is loading", () => {
      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.isLoading).toBe(true);
    });

    it("should return profile error when profile query fails", () => {
      const mockError = new Error("Failed to fetch profile");

      mockTrpcClientProfileGet.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      mockTrpcClientProfileUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
      });

      const { result } = renderHook(() => useSettingsForm());

      expect(result.current.profileError).toEqual(mockError);
    });
  });
});

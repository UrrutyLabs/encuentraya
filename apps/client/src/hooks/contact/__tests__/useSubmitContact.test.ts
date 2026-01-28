import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitContact } from "../useSubmitContact";
import { mockTrpcContactSubmit } from "@/test-setup";
import type { ContactFormInput } from "@repo/domain";

describe("useSubmitContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when submission succeeds", () => {
    it("should return success data", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        success: true,
        message:
          "Your message has been sent successfully. We'll get back to you soon!",
      });

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        data: undefined,
      }));

      const { result } = renderHook(() => useSubmitContact());

      const input: ContactFormInput = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Test Subject",
        message: "This is a test message with enough characters.",
      };

      await act(async () => {
        await result.current.submitContact(input);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(input);
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    it("should handle successful submission with correct input format", async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        success: true,
        message: "Message sent",
      });

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        data: undefined,
      }));

      const { result } = renderHook(() => useSubmitContact());

      const input: ContactFormInput = {
        name: "Jane Smith",
        email: "jane@example.com",
        subject: "Help Request",
        message:
          "I need help with my job. Please contact me as soon as possible.",
      };

      await act(async () => {
        await result.current.submitContact(input);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: "Jane Smith",
        email: "jane@example.com",
        subject: "Help Request",
        message:
          "I need help with my job. Please contact me as soon as possible.",
      });
    });
  });

  describe("when submission fails", () => {
    it("should throw error when mutation fails", async () => {
      const mockError = new Error("Failed to send message");

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        data: undefined,
      }));

      const { result } = renderHook(() => useSubmitContact());

      const input: ContactFormInput = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Test Subject",
        message: "This is a test message with enough characters.",
      };

      await act(async () => {
        await expect(result.current.submitContact(input)).rejects.toThrow(
          "Failed to send message"
        );
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(input);
    });

    it("should handle rate limiting error", async () => {
      const mockError = {
        message: "Too many requests from this email. Please try again later.",
        data: {
          code: "TOO_MANY_REQUESTS",
        },
      };

      const mockMutateAsync = vi.fn().mockRejectedValue(mockError);

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: mockError,
        data: undefined,
      }));

      const { result } = renderHook(() => useSubmitContact());

      const input: ContactFormInput = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Test Subject",
        message: "This is a test message with enough characters.",
      };

      await act(async () => {
        await expect(result.current.submitContact(input)).rejects.toEqual(
          mockError
        );
      });
    });
  });

  describe("mutation state", () => {
    it("should return isPending state", () => {
      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: true,
        error: null,
        data: undefined,
      }));

      const { result } = renderHook(() => useSubmitContact());

      expect(result.current.isPending).toBe(true);
    });

    it("should return error state", () => {
      const mockError = {
        message: "Network error",
        data: {
          code: "INTERNAL_SERVER_ERROR",
        },
      };

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockError,
        data: undefined,
        isSuccess: false,
      }));

      const { result } = renderHook(() => useSubmitContact());

      expect(result.current.error).toEqual(mockError);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isPending).toBe(false);
    });

    it("should return data state after successful submission", () => {
      const mockData = {
        success: true,
        message: "Message sent successfully",
      };

      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
        data: mockData,
        isSuccess: true,
      }));

      const { result } = renderHook(() => useSubmitContact());

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isPending).toBe(false);
    });
  });

  describe("hook return values", () => {
    it("should return all expected properties", () => {
      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
        data: undefined,
        isSuccess: false,
      }));

      const { result } = renderHook(() => useSubmitContact());

      expect(result.current).toHaveProperty("submitContact");
      expect(result.current).toHaveProperty("isPending");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isSuccess");
      expect(typeof result.current.submitContact).toBe("function");
    });

    it("should return isSuccess state", () => {
      mockTrpcContactSubmit.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
        error: null,
        data: {
          success: true,
          message: "Message sent",
        },
        isSuccess: true,
      }));

      const { result } = renderHook(() => useSubmitContact());

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.success).toBe(true);
    });
  });
});

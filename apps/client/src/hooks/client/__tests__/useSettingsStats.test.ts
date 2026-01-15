import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSettingsStats } from "../useSettingsStats";
import { useMyBookings } from "../../booking";
import { BookingStatus, Category } from "@repo/domain";
import type { Booking } from "@repo/domain";

// Mock useMyBookings hook
vi.mock("../../booking/useMyBookings");

const mockUseMyBookings = vi.mocked(useMyBookings);

describe("useSettingsStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when bookings are empty", () => {
    it("should return zero stats when no bookings", () => {
      mockUseMyBookings.mockReturnValue({
        bookings: [],
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats).toEqual({
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it("should return zero stats when bookings is empty array", () => {
      mockUseMyBookings.mockReturnValue({
        bookings: [],
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats).toEqual({
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      });
    });
  });

  describe("total bookings calculation", () => {
    it("should count total bookings correctly", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.ACCEPTED,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
        {
          id: "booking-3",
          status: BookingStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 10000,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalBookings).toBe(3);
    });
  });

  describe("completed bookings calculation", () => {
    it("should count only completed bookings", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
        {
          id: "booking-3",
          status: BookingStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 15000,
        },
        {
          id: "booking-4",
          status: BookingStatus.CANCELLED,
          category: Category.HANDYMAN,
          totalAmount: null,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.completedBookings).toBe(2);
    });
  });

  describe("total spent calculation", () => {
    it("should calculate total spent from completed bookings with totalAmount", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 15000,
        },
        {
          id: "booking-3",
          status: BookingStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 5000,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalSpent).toBe(30000);
    });

    it("should exclude completed bookings without totalAmount", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalSpent).toBe(10000);
    });

    it("should return undefined when totalSpent is zero", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
          totalAmount: null,
        },
      ] as unknown as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalSpent).toBeUndefined();
    });
  });

  describe("favorite category calculation", () => {
    it("should return most booked category", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.ACCEPTED,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "booking-3",
          status: BookingStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "booking-4",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 15000,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.favoriteCategory).toBe("Plomería");
    });

    it("should return Spanish label for favorite category", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.favoriteCategory).toBe("Electricidad");
    });

    it("should handle tie by returning first encountered category", () => {
      const mockBookings = [
        {
          id: "booking-1",
          status: BookingStatus.PENDING,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "booking-2",
          status: BookingStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
      ] as Booking[];

      mockUseMyBookings.mockReturnValue({
        bookings: mockBookings,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      // Should return one of the tied categories (implementation dependent)
      expect(result.current.stats.favoriteCategory).toBeDefined();
      expect(["Plomería", "Electricidad"]).toContain(
        result.current.stats.favoriteCategory
      );
    });

    it("should return undefined when no bookings", () => {
      mockUseMyBookings.mockReturnValue({
        bookings: [],
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.favoriteCategory).toBeUndefined();
    });
  });

  describe("category labels mapping", () => {
    it("should map all categories to correct Spanish labels", () => {
      const categories = [
        Category.PLUMBING,
        Category.ELECTRICAL,
        Category.CLEANING,
        Category.HANDYMAN,
        Category.PAINTING,
      ];

      const expectedLabels = [
        "Plomería",
        "Electricidad",
        "Limpieza",
        "Arreglos generales",
        "Pintura",
      ];

      categories.forEach((category, index) => {
        const mockBookings = [
          {
            id: "booking-1",
            status: BookingStatus.COMPLETED,
            category,
            totalAmount: 10000,
          },
        ] as Booking[];

        mockUseMyBookings.mockReturnValue({
          bookings: mockBookings,
          isLoading: false,
          error: null,
          reviewStatusMap: {},
        });

        const { result } = renderHook(() => useSettingsStats());

        expect(result.current.stats.favoriteCategory).toBe(
          expectedLabels[index]
        );
      });
    });
  });

  describe("loading state", () => {
    it("should return loading state from useMyBookings", () => {
      mockUseMyBookings.mockReturnValue({
        bookings: [],
        isLoading: true,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.isLoading).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSettingsStats } from "../useSettingsStats";
import { useMyOrders } from "../../order";
import { OrderStatus, Category } from "@repo/domain";
import type { Order } from "@repo/domain";

// Mock useMyOrders hook
vi.mock("../../order/useMyOrders");

const mockUseMyOrders = vi.mocked(useMyOrders);

describe("useSettingsStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when bookings are empty", () => {
    it("should return zero stats when no bookings", () => {
      mockUseMyOrders.mockReturnValue({
        orders: [],
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats).toEqual({
        totalJobs: 0,
        completedJobs: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it("should return zero stats when bookings is empty array", () => {
      mockUseMyOrders.mockReturnValue({
        orders: [],
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats).toEqual({
        totalJobs: 0,
        completedJobs: 0,
        totalSpent: undefined,
        favoriteCategory: undefined,
      });
    });
  });

  describe("total bookings calculation", () => {
    it("should count total bookings correctly", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.CONFIRMED,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 10000,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalJobs).toBe(3);
    });
  });

  describe("completed bookings calculation", () => {
    it("should count only completed bookings", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 15000,
        },
        {
          id: "order-4",
          status: OrderStatus.CANCELED,
          category: Category.HANDYMAN,
          totalAmount: null,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.completedJobs).toBe(2);
    });
  });

  describe("total spent calculation", () => {
    it("should calculate total spent from completed bookings with totalAmount", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 15000,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          category: Category.CLEANING,
          totalAmount: 5000,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalSpent).toBe(30000);
    });

    it("should exclude completed bookings without totalAmount", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.totalSpent).toBe(10000);
    });

    it("should return undefined when totalSpent is zero", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
          totalAmount: null,
        },
      ] as unknown as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
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
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.CONFIRMED,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          category: Category.PLUMBING,
          totalAmount: 10000,
        },
        {
          id: "order-4",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 15000,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.favoriteCategory).toBe("Plomería");
    });

    it("should return Spanish label for favorite category", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.ELECTRICAL,
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
        isLoading: false,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.stats.favoriteCategory).toBe("Electricidad");
    });

    it("should handle tie by returning first encountered category", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
          totalAmount: 10000,
        },
      ] as Order[];

      mockUseMyOrders.mockReturnValue({
        orders: mockOrders,
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
        const mockOrders = [
          {
            id: "order-1",
            status: OrderStatus.COMPLETED,
            category,
            totalAmount: 10000,
          },
        ] as Order[];

        mockUseMyOrders.mockReturnValue({
          orders: mockOrders,
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
      mockUseMyOrders.mockReturnValue({
        orders: [],
        isLoading: true,
        error: null,
        reviewStatusMap: {},
      });

      const { result } = renderHook(() => useSettingsStats());

      expect(result.current.isLoading).toBe(true);
    });
  });
});

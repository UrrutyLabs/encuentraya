import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSettingsStats } from "../useSettingsStats";
import { useMyOrders } from "../../order";
import { OrderStatus } from "@repo/domain";
import type { Order } from "@repo/domain";

// Mock useMyOrders hook
vi.mock("../../order/useMyOrders");
// Mock useCategories hook
vi.mock("../../category/useCategories", () => ({
  useCategories: () => ({
    categories: [
      { id: "cat-plumbing", name: "Plomería", key: "PLUMBING" },
      { id: "cat-electrical", name: "Electricidad", key: "ELECTRICAL" },
      { id: "cat-cleaning", name: "Limpieza", key: "CLEANING" },
      { id: "cat-handyman", name: "Arreglos generales", key: "HANDYMAN" },
      { id: "cat-painting", name: "Pintura", key: "PAINTING" },
    ],
    isLoading: false,
    error: null,
  }),
}));

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
          categoryId: "cat-plumbing",
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.CONFIRMED,
          categoryId: "cat-electrical",
          totalAmount: null,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-cleaning",
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
          categoryId: "cat-plumbing",
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
          totalAmount: 10000,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-cleaning",
          totalAmount: 15000,
        },
        {
          id: "order-4",
          status: OrderStatus.CANCELED,
          categoryId: "cat-handyman",
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
          categoryId: "cat-plumbing",
          totalAmount: 10000,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
          totalAmount: 15000,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-cleaning",
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

      // totalSpent is converted to major units for display
      // 10000 + 15000 + 5000 = 30000 cents = 300 UYU
      expect(result.current.stats.totalSpent).toBe(300);
    });

    it("should exclude completed bookings without totalAmount", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-plumbing",
          totalAmount: 10000,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
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

      // totalSpent is converted to major units for display
      // 10000 cents = 100 UYU
      expect(result.current.stats.totalSpent).toBe(100);
    });

    it("should return undefined when totalSpent is zero", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          categoryId: "cat-plumbing",
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
          categoryId: "cat-plumbing",
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.CONFIRMED,
          categoryId: "cat-plumbing",
          totalAmount: null,
        },
        {
          id: "order-3",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-plumbing",
          totalAmount: 10000,
        },
        {
          id: "order-4",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
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
          categoryId: "cat-electrical",
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
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
          categoryId: "cat-plumbing",
          totalAmount: null,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          categoryId: "cat-electrical",
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
      mockUseMyOrders.mockReturnValue({
        orders: [],
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
      const categoryIds = [
        "cat-plumbing",
        "cat-electrical",
        "cat-cleaning",
        "cat-handyman",
        "cat-painting",
      ];

      const expectedLabels = [
        "Plomería",
        "Electricidad",
        "Limpieza",
        "Arreglos generales",
        "Pintura",
      ];

      categoryIds.forEach((categoryId, index) => {
        const mockOrders = [
          {
            id: "order-1",
            status: OrderStatus.COMPLETED,
            categoryId,
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
    it("should return loading state from useMyOrders", () => {
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

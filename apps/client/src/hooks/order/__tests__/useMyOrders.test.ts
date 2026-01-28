import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMyOrders } from "../useMyOrders";
import {
  mockTrpcOrderListByClient,
  mockTrpcReviewStatusByOrderIds,
} from "@/test-setup";
import { OrderStatus, Category } from "@repo/domain";
import type { Order } from "@repo/domain";

describe("useMyOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when orders are loaded", () => {
    it("should return orders array", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
        },
      ] as unknown as Order[];

      mockTrpcOrderListByClient.mockReturnValue({
        data: mockOrders,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyOrders());

      expect(result.current.orders).toEqual(mockOrders);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.reviewStatusMap).toEqual({});
    });

    it("should return empty array when orders is null", () => {
      mockTrpcOrderListByClient.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyOrders());

      expect(result.current.orders).toEqual([]);
    });
  });

  describe("review status map", () => {
    it("should fetch review status for completed orders", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.COMPLETED,
          category: Category.PLUMBING,
        },
        {
          id: "order-2",
          status: OrderStatus.COMPLETED,
          category: Category.ELECTRICAL,
        },
        {
          id: "order-3",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.CLEANING,
        },
      ] as unknown as Order[];

      mockTrpcOrderListByClient.mockReturnValue({
        data: mockOrders,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {
          "order-1": true,
          "order-2": false,
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyOrders());

      expect(result.current.reviewStatusMap).toEqual({
        "order-1": true,
        "order-2": false,
      });
    });

    it("should not fetch review status when no completed orders", () => {
      const mockOrders = [
        {
          id: "order-1",
          status: OrderStatus.PENDING_PRO_CONFIRMATION,
          category: Category.PLUMBING,
        },
      ] as unknown as Order[];

      mockTrpcOrderListByClient.mockReturnValue({
        data: mockOrders,
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyOrders());

      expect(mockTrpcReviewStatusByOrderIds).toHaveBeenCalledWith(
        { orderIds: [] },
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe("loading and error states", () => {
    it("should return loading state when orders are loading", () => {
      mockTrpcOrderListByClient.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyOrders());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.orders).toEqual([]);
    });

    it("should return error when query fails", () => {
      const mockError = new Error("Failed to fetch orders");

      mockTrpcOrderListByClient.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyOrders());

      expect(result.current.error).toEqual(mockError);
      expect(result.current.orders).toEqual([]);
    });
  });

  describe("query configuration", () => {
    it("should enable query when user exists", () => {
      mockTrpcOrderListByClient.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyOrders());

      expect(mockTrpcOrderListByClient).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: true,
          retry: false,
        })
      );
    });

    it("should set retry to false", () => {
      mockTrpcOrderListByClient.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockTrpcReviewStatusByOrderIds.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyOrders());

      expect(mockTrpcOrderListByClient).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          retry: false,
        })
      );
    });
  });
});

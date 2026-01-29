import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRebookTemplate } from "../useRebookTemplate";
import { mockTrpcOrderGetById } from "@/test-setup";
import { OrderStatus } from "@repo/domain";

describe("useRebookTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when orderId is provided", () => {
    it("should fetch order data", () => {
      const mockOrder = {
        id: "order-1",
        proProfileId: "pro-1",
        categoryId: "cat-plumbing",
        description: "Fix leak",
        estimatedHours: 2,
        status: OrderStatus.COMPLETED,
      };

      mockTrpcOrderGetById.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRebookTemplate("order-1"));

      expect(mockTrpcOrderGetById).toHaveBeenCalledWith(
        { id: "order-1" },
        {
          enabled: true,
          retry: false,
        }
      );

      expect(result.current.data).toEqual(mockOrder);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("when orderId is undefined", () => {
    it("should disable query", () => {
      mockTrpcOrderGetById.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRebookTemplate(undefined));

      expect(mockTrpcOrderGetById).toHaveBeenCalledWith(
        { id: undefined },
        {
          enabled: false,
          retry: false,
        }
      );
    });
  });
});

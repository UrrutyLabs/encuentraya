import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    OrderLineItemRepository: "OrderLineItemRepository",
  },
}));

import { OrderService } from "../order.service";
import type { OrderRepository, OrderEntity } from "../order.repo";
import type {
  OrderLineItemRepository,
  OrderLineItemEntity,
} from "../orderLineItem.repo";
import { OrderStatus, Category, OrderLineItemType } from "@repo/domain";
import { OrderNotFoundError } from "../order.errors";

describe("OrderService", () => {
  let service: OrderService;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockOrderLineItemRepository: ReturnType<
    typeof createMockOrderLineItemRepository
  >;

  function createMockOrderRepository(): {
    findById: ReturnType<typeof vi.fn>;
    findByDisplayId: ReturnType<typeof vi.fn>;
    findByClientUserId: ReturnType<typeof vi.fn>;
    findByProProfileId: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      findByDisplayId: vi.fn(),
      findByClientUserId: vi.fn(),
      findByProProfileId: vi.fn(),
      updateStatus: vi.fn(),
    };
  }

  function createMockOrderLineItemRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
    };
  }

  function createMockOrder(overrides?: Partial<OrderEntity>): OrderEntity {
    return {
      id: "order-1",
      displayId: "O0001",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: Category.PLUMBING,
      subcategoryId: null,
      title: null,
      description: null,
      addressText: "123 Main St",
      addressLat: null,
      addressLng: null,
      scheduledWindowStartAt: new Date("2026-02-01T10:00:00Z"),
      scheduledWindowEndAt: null,
      status: OrderStatus.PENDING_PRO_CONFIRMATION,
      acceptedAt: null,
      confirmedAt: null,
      startedAt: null,
      arrivedAt: null,
      completedAt: null,
      paidAt: null,
      canceledAt: null,
      cancelReason: null,
      pricingMode: "hourly",
      hourlyRateSnapshotAmount: 100,
      currency: "UYU",
      minHoursSnapshot: null,
      estimatedHours: 2,
      finalHoursSubmitted: null,
      approvedHours: null,
      approvalMethod: null,
      approvalDeadlineAt: null,
      subtotalAmount: null,
      platformFeeAmount: null,
      taxAmount: null,
      totalAmount: null,
      totalsCalculatedAt: null,
      taxScheme: null,
      taxRate: null,
      taxIncluded: false,
      taxRegion: null,
      taxCalculatedAt: null,
      disputeStatus: "none",
      disputeReason: null,
      disputeOpenedBy: null,
      isFirstOrder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockOrderLineItem(
    overrides?: Partial<OrderLineItemEntity>
  ): OrderLineItemEntity {
    return {
      id: "line-item-1",
      orderId: "order-1",
      type: OrderLineItemType.LABOR,
      description: "Labor (2 horas × 100 UYU/hora)",
      quantity: 2,
      unitAmount: 100,
      amount: 200,
      currency: "UYU",
      taxBehavior: "taxable",
      taxRate: null,
      metadata: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderRepository = createMockOrderRepository();
    mockOrderLineItemRepository = createMockOrderLineItemRepository();

    service = new OrderService(
      mockOrderRepository as unknown as OrderRepository,
      mockOrderLineItemRepository as unknown as OrderLineItemRepository
    );
  });

  describe("getOrderById", () => {
    it("should return order when found", async () => {
      const orderEntity = createMockOrder();
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.findById.mockResolvedValue(orderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const result = await service.getOrderById("order-1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("order-1");
      expect(result?.displayId).toBe("O0001");
      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order-1");
      expect(mockOrderLineItemRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
    });

    it("should return null when order not found", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const result = await service.getOrderById("order-1");

      expect(result).toBeNull();
      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order-1");
      expect(mockOrderLineItemRepository.findByOrderId).not.toHaveBeenCalled();
    });

    it("should map order entity to domain correctly", async () => {
      const orderEntity = createMockOrder({
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.findById.mockResolvedValue(orderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const result = await service.getOrderById("order-1");

      expect(result).toBeDefined();
      expect(result?.status).toBe(OrderStatus.COMPLETED);
      expect(result?.proProfileId).toBe("pro-1");
      expect(result?.category).toBe(Category.PLUMBING);
    });
  });

  describe("getOrderByDisplayId", () => {
    it("should return order when found by display ID", async () => {
      const orderEntity = createMockOrder({ displayId: "O0001" });
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.findByDisplayId.mockResolvedValue(orderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const result = await service.getOrderByDisplayId("O0001");

      expect(result).toBeDefined();
      expect(result?.displayId).toBe("O0001");
      expect(mockOrderRepository.findByDisplayId).toHaveBeenCalledWith("O0001");
      expect(mockOrderLineItemRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
    });

    it("should return null when order not found by display ID", async () => {
      mockOrderRepository.findByDisplayId.mockResolvedValue(null);

      const result = await service.getOrderByDisplayId("O0001");

      expect(result).toBeNull();
      expect(mockOrderRepository.findByDisplayId).toHaveBeenCalledWith("O0001");
      expect(mockOrderLineItemRepository.findByOrderId).not.toHaveBeenCalled();
    });
  });

  describe("getOrdersByClient", () => {
    it("should return orders for a client", async () => {
      const orderEntity1 = createMockOrder({ id: "order-1" });
      const orderEntity2 = createMockOrder({ id: "order-2" });
      const lineItems1 = [createMockOrderLineItem({ orderId: "order-1" })];
      const lineItems2 = [createMockOrderLineItem({ orderId: "order-2" })];

      mockOrderRepository.findByClientUserId.mockResolvedValue([
        orderEntity1,
        orderEntity2,
      ]);
      mockOrderLineItemRepository.findByOrderId
        .mockResolvedValueOnce(lineItems1)
        .mockResolvedValueOnce(lineItems2);

      const result = await service.getOrdersByClient("client-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("order-1");
      expect(result[1].id).toBe("order-2");
      expect(mockOrderRepository.findByClientUserId).toHaveBeenCalledWith(
        "client-1"
      );
      expect(mockOrderLineItemRepository.findByOrderId).toHaveBeenCalledTimes(
        2
      );
    });

    it("should return empty array when client has no orders", async () => {
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);

      const result = await service.getOrdersByClient("client-1");

      expect(result).toEqual([]);
      expect(mockOrderRepository.findByClientUserId).toHaveBeenCalledWith(
        "client-1"
      );
      expect(mockOrderLineItemRepository.findByOrderId).not.toHaveBeenCalled();
    });
  });

  describe("getOrdersByPro", () => {
    it("should return orders for a pro", async () => {
      const orderEntity1 = createMockOrder({
        id: "order-1",
        proProfileId: "pro-1",
      });
      const orderEntity2 = createMockOrder({
        id: "order-2",
        proProfileId: "pro-1",
      });
      const lineItems1 = [createMockOrderLineItem({ orderId: "order-1" })];
      const lineItems2 = [createMockOrderLineItem({ orderId: "order-2" })];

      mockOrderRepository.findByProProfileId.mockResolvedValue([
        orderEntity1,
        orderEntity2,
      ]);
      mockOrderLineItemRepository.findByOrderId
        .mockResolvedValueOnce(lineItems1)
        .mockResolvedValueOnce(lineItems2);

      const result = await service.getOrdersByPro("pro-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("order-1");
      expect(result[1].id).toBe("order-2");
      expect(mockOrderRepository.findByProProfileId).toHaveBeenCalledWith(
        "pro-1"
      );
      expect(mockOrderLineItemRepository.findByOrderId).toHaveBeenCalledTimes(
        2
      );
    });

    it("should return empty array when pro has no orders", async () => {
      mockOrderRepository.findByProProfileId.mockResolvedValue([]);

      const result = await service.getOrdersByPro("pro-1");

      expect(result).toEqual([]);
      expect(mockOrderRepository.findByProProfileId).toHaveBeenCalledWith(
        "pro-1"
      );
      expect(mockOrderLineItemRepository.findByOrderId).not.toHaveBeenCalled();
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status and return updated order", async () => {
      const updatedOrderEntity = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const result = await service.updateOrderStatus(
        "order-1",
        OrderStatus.ACCEPTED
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe(OrderStatus.ACCEPTED);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.ACCEPTED,
        undefined
      );
    });

    it("should update order status with metadata", async () => {
      const updatedOrderEntity = createMockOrder({
        status: OrderStatus.CANCELED,
        cancelReason: "Client requested cancellation",
      });
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const metadata = { cancelReason: "Client requested cancellation" };
      const result = await service.updateOrderStatus(
        "order-1",
        OrderStatus.CANCELED,
        metadata
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe(OrderStatus.CANCELED);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CANCELED,
        metadata
      );
    });

    it("should return null when order not found", async () => {
      mockOrderRepository.updateStatus.mockResolvedValue(null);

      const result = await service.updateOrderStatus(
        "order-1",
        OrderStatus.ACCEPTED
      );

      expect(result).toBeNull();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.ACCEPTED,
        undefined
      );
      expect(mockOrderLineItemRepository.findByOrderId).not.toHaveBeenCalled();
    });
  });

  describe("getOrderOrThrow", () => {
    it("should return order when found", async () => {
      const orderEntity = createMockOrder();
      const lineItems = [createMockOrderLineItem()];

      mockOrderRepository.findById.mockResolvedValue(orderEntity);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue(lineItems);

      const result = await service.getOrderOrThrow("order-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("order-1");
    });

    it("should throw OrderNotFoundError when order not found", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(service.getOrderOrThrow("order-1")).rejects.toThrow(
        OrderNotFoundError
      );
      await expect(service.getOrderOrThrow("order-1")).rejects.toThrow(
        "Order not found: order-1"
      );
    });
  });

  describe("createOrder", () => {
    it("should throw error directing to use OrderCreationService", async () => {
      await expect(
        service.createOrder({
          proProfileId: "pro-1",
          category: Category.PLUMBING,
          addressText: "123 Main St",
          scheduledWindowStartAt: new Date(),
          estimatedHours: 2,
        })
      ).rejects.toThrow(
        "Use OrderCreationService.createOrderRequest() instead of OrderService.createOrder()"
      );
    });
  });
});

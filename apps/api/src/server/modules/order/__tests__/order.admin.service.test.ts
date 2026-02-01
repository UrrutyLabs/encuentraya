import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    OrderService: "OrderService",
    AuditService: "AuditService",
  },
}));

import { OrderAdminService } from "../order.admin.service";
import type { OrderRepository } from "../order.repo";
import type { AuditService } from "@modules/audit/audit.service";
import { OrderService } from "../order.service";
import type { Order } from "@repo/domain";
import {
  OrderStatus as OrderStatusEnum,
  PricingMode,
  DisputeStatus,
  Role,
} from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { AuditEventType } from "@modules/audit/audit.repo";

describe("OrderAdminService", () => {
  let service: OrderAdminService;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockOrderService: ReturnType<typeof createMockOrderService>;
  let mockAuditService: ReturnType<typeof createMockAuditService>;

  function createMockOrderRepository(): {
    findAll: ReturnType<typeof vi.fn>;
  } {
    return {
      findAll: vi.fn(),
    };
  }

  function createMockOrderService(): {
    getOrderOrThrow: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      getOrderOrThrow: vi.fn(),
      updateOrderStatus: vi.fn(),
    };
  }

  function createMockAuditService(): {
    logEvent: ReturnType<typeof vi.fn>;
  } {
    return {
      logEvent: vi.fn(),
    };
  }

  function createMockActor(id = "admin-1"): Actor {
    return { id, role: Role.ADMIN };
  }

  function createMockOrder(overrides?: Partial<Order>): Order {
    return {
      id: "order-1",
      displayId: "O0001",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      categoryId: "cat-plumbing",
      categoryMetadataJson: null,
      subcategoryId: null,
      title: null,
      description: null,
      addressText: "123 Main St",
      addressLat: null,
      addressLng: null,
      scheduledWindowStartAt: new Date(),
      scheduledWindowEndAt: null,
      status: OrderStatusEnum.PENDING_PRO_CONFIRMATION,
      acceptedAt: null,
      confirmedAt: null,
      startedAt: null,
      arrivedAt: null,
      completedAt: null,
      paidAt: null,
      canceledAt: null,
      cancelReason: null,
      pricingMode: PricingMode.HOURLY,
      hourlyRateSnapshotAmount: 100,
      currency: "UYU",
      minHoursSnapshot: null,
      quotedAmountCents: null,
      quotedAt: null,
      quoteMessage: null,
      quoteAcceptedAt: null,
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
      disputeStatus: DisputeStatus.NONE,
      disputeReason: null,
      disputeOpenedBy: null,
      isFirstOrder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderRepository = createMockOrderRepository();
    mockOrderService = createMockOrderService();
    mockAuditService = createMockAuditService();

    service = new OrderAdminService(
      mockOrderRepository as unknown as OrderRepository,
      mockOrderService as unknown as OrderService,
      mockAuditService as unknown as AuditService
    );
  });

  describe("adminListOrders", () => {
    it("should return empty array (filtering not yet implemented)", async () => {
      const result = await service.adminListOrders();

      expect(result).toEqual([]);
    });

    it("should accept filters parameter", async () => {
      const filters = {
        status: OrderStatusEnum.COMPLETED,
        query: "O0001",
        dateFrom: new Date(),
        dateTo: new Date(),
        limit: 10,
        cursor: "cursor-1",
      };

      const result = await service.adminListOrders(filters);

      expect(result).toEqual([]);
    });
  });

  describe("adminGetOrderById", () => {
    it("should return order by ID", async () => {
      const order = createMockOrder();

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      const result = await service.adminGetOrderById("order-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("order-1");
      expect(mockOrderService.getOrderOrThrow).toHaveBeenCalledWith("order-1");
    });

    it("should throw error if order not found", async () => {
      mockOrderService.getOrderOrThrow.mockRejectedValue(
        new Error("Order not found: order-1")
      );

      await expect(service.adminGetOrderById("order-1")).rejects.toThrow(
        "Order not found: order-1"
      );
    });
  });

  describe("adminUpdateStatus", () => {
    it("should update order status and log audit event", async () => {
      const actor = createMockActor();
      const order = createMockOrder({
        status: OrderStatusEnum.PENDING_PRO_CONFIRMATION,
      });
      const updatedOrder = createMockOrder({
        status: OrderStatusEnum.CANCELED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      const result = await service.adminUpdateStatus(
        actor,
        "order-1",
        OrderStatusEnum.CANCELED,
        "Admin cancellation"
      );

      expect(result.status).toBe(OrderStatusEnum.CANCELED);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatusEnum.CANCELED,
        { cancelReason: "Admin cancellation" }
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.ORDER_STATUS_FORCED,
        actor,
        resourceType: "order",
        resourceId: "order-1",
        action: "force_status",
        metadata: {
          oldStatus: OrderStatusEnum.PENDING_PRO_CONFIRMATION,
          newStatus: OrderStatusEnum.CANCELED,
          reason: "Admin cancellation",
        },
      });
    });

    it("should update order status without reason", async () => {
      const actor = createMockActor();
      const order = createMockOrder({
        status: OrderStatusEnum.PENDING_PRO_CONFIRMATION,
      });
      const updatedOrder = createMockOrder({
        status: OrderStatusEnum.ACCEPTED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      const result = await service.adminUpdateStatus(
        actor,
        "order-1",
        OrderStatusEnum.ACCEPTED
      );

      expect(result.status).toBe(OrderStatusEnum.ACCEPTED);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatusEnum.ACCEPTED,
        undefined
      );
      expect(mockAuditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: undefined,
          }),
        })
      );
    });

    it("should throw error if order update fails", async () => {
      const actor = createMockActor();
      const order = createMockOrder();

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderService.updateOrderStatus.mockResolvedValue(null);

      await expect(
        service.adminUpdateStatus(actor, "order-1", OrderStatusEnum.CANCELED)
      ).rejects.toThrow("Failed to update order status: order-1");
    });
  });
});

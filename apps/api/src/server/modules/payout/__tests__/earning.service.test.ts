import { describe, it, expect, beforeEach, vi } from "vitest";
import { EarningService, EarningCreationError } from "../earning.service";
import type { EarningRepository, EarningEntity } from "../earning.repo";
import type { OrderRepository, OrderEntity } from "@modules/order/order.repo";
import type {
  OrderLineItemRepository,
  OrderLineItemEntity,
} from "@modules/order/orderLineItem.repo";
import type {
  PaymentRepository,
  PaymentEntity,
} from "@modules/payment/payment.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  PaymentType,
  OrderLineItemType,
} from "@repo/domain";
import { OrderNotFoundError } from "@modules/order/order.errors";
import type { Actor } from "@infra/auth/roles";

describe("EarningService", () => {
  let service: EarningService;
  let mockEarningRepository: ReturnType<typeof createMockEarningRepository>;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockOrderLineItemRepository: ReturnType<
    typeof createMockOrderLineItemRepository
  >;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;

  function createMockEarningRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
    createFromOrder: ReturnType<typeof vi.fn>;
    listPendingDue: ReturnType<typeof vi.fn>;
    markManyStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
      createFromOrder: vi.fn(),
      listPendingDue: vi.fn(),
      markManyStatus: vi.fn(),
    };
  }

  function createMockOrderRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockOrderLineItemRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
    };
  }

  function createMockPaymentRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
    };
  }

  function createMockActor(
    role: "CLIENT" | "PRO" | "ADMIN" | "SYSTEM" = "ADMIN",
    id = "actor-1"
  ): Actor | { role: "SYSTEM" } {
    if (role === "SYSTEM") {
      return { role: "SYSTEM" };
    }
    return { id, role: role as Actor["role"] };
  }

  function createMockOrder(overrides?: Partial<OrderEntity>): OrderEntity {
    return {
      id: "order-1",
      displayId: "O0001",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "PLUMBING",
      subcategoryId: null,
      title: null,
      description: null,
      addressText: "123 Main St",
      addressLat: null,
      addressLng: null,
      scheduledWindowStartAt: new Date(),
      scheduledWindowEndAt: null,
      status: OrderStatus.COMPLETED,
      acceptedAt: new Date(),
      confirmedAt: null,
      startedAt: null,
      arrivedAt: null,
      completedAt: new Date(),
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

  function createMockPayment(
    overrides?: Partial<PaymentEntity>
  ): PaymentEntity {
    return {
      id: "payment-1",
      provider: PaymentProvider.MERCADO_PAGO,
      type: PaymentType.PREAUTH,
      status: PaymentStatus.CAPTURED,
      orderId: "order-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      currency: "UYU",
      amountEstimated: 20000,
      amountAuthorized: 20000,
      amountCaptured: 20000,
      providerReference: "mp-ref-123",
      checkoutUrl: null,
      idempotencyKey: "order-1-1234567890",
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
      amount: 200, // In major units (dollars)
      currency: "UYU",
      taxBehavior: "taxable",
      taxRate: null,
      metadata: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  function createMockEarning(
    overrides?: Partial<EarningEntity>
  ): EarningEntity {
    return {
      id: "earning-1",
      orderId: "order-1",
      proProfileId: "pro-1",
      clientUserId: "client-1",
      currency: "UYU",
      grossAmount: 20000, // In minor units (cents)
      platformFeeAmount: 2000, // In minor units (cents)
      netAmount: 18000, // In minor units (cents)
      status: "PENDING",
      availableAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockEarningRepository = createMockEarningRepository();
    mockOrderRepository = createMockOrderRepository();
    mockOrderLineItemRepository = createMockOrderLineItemRepository();
    mockPaymentRepository = createMockPaymentRepository();
    mockProRepository = createMockProRepository();

    service = new EarningService(
      mockEarningRepository as unknown as EarningRepository,
      mockPaymentRepository as unknown as PaymentRepository,
      mockProRepository as unknown as ProRepository,
      mockOrderRepository as unknown as OrderRepository,
      mockOrderLineItemRepository as unknown as OrderLineItemRepository
    );
  });

  describe("createEarningForOrder", () => {
    it("should create an earning for a completed order", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({
        id: "order-1",
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
        currency: "UYU",
      });
      const payment = createMockPayment({
        orderId: "order-1",
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
        currency: "UYU",
      });
      const laborItem = createMockOrderLineItem({
        type: OrderLineItemType.LABOR,
        amount: 200, // $200.00 in major units
      });
      const platformFeeItem = createMockOrderLineItem({
        type: OrderLineItemType.PLATFORM_FEE,
        amount: 20, // $20.00 in major units
      });
      const earning = createMockEarning();

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([
        laborItem,
        platformFeeItem,
      ]);
      mockEarningRepository.createFromOrder.mockResolvedValue(earning);

      await service.createEarningForOrder(actor, "order-1");

      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order-1");
      expect(mockEarningRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      expect(mockOrderLineItemRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      expect(mockEarningRepository.createFromOrder).toHaveBeenCalledWith({
        orderId: "order-1",
        proProfileId: "pro-1",
        clientUserId: "client-1",
        currency: "UYU",
        grossAmount: 20000, // $200.00 * 100 = 20000 cents
        platformFeeAmount: 2000, // $20.00 * 100 = 2000 cents
        netAmount: 18000, // 20000 - 2000
        availableAt: expect.any(Date),
      });
    });

    it("should be idempotent if earning already exists", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({ status: OrderStatus.COMPLETED });
      const existingEarning = createMockEarning();

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(existingEarning);

      await service.createEarningForOrder(actor, "order-1");

      expect(mockEarningRepository.createFromOrder).not.toHaveBeenCalled();
    });

    it("should throw error if order not found", async () => {
      const actor = createMockActor("ADMIN");
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow(OrderNotFoundError);
    });

    it("should throw error if order is not COMPLETED", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });

      mockOrderRepository.findById.mockResolvedValue(order);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow(EarningCreationError);
      expect(mockEarningRepository.createFromOrder).not.toHaveBeenCalled();
    });

    it("should throw error if payment not found", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({ status: OrderStatus.COMPLETED });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("No payment found for order order-1");
    });

    it("should throw error if payment is not CAPTURED", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({ status: OrderStatus.COMPLETED });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("Payment for order order-1 must be CAPTURED");
    });

    it("should throw error if payment has no captured amount", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({ status: OrderStatus.COMPLETED });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: null,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("Payment for order order-1 has no captured amount");
    });

    it("should throw error if order has no proProfileId", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
        proProfileId: null,
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("Order order-1 has no proProfileId");
    });

    it("should throw error if order has no labor line item", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });
      const platformFeeItem = createMockOrderLineItem({
        type: OrderLineItemType.PLATFORM_FEE,
        amount: 20,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([
        platformFeeItem,
      ]);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("Order order-1 has no labor line item");
    });

    it("should throw error if order has no platform_fee line item", async () => {
      const actor = createMockActor("ADMIN");
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });
      const laborItem = createMockOrderLineItem({
        type: OrderLineItemType.LABOR,
        amount: 200,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([laborItem]);

      await expect(
        service.createEarningForOrder(actor, "order-1")
      ).rejects.toThrow("Order order-1 has no platform_fee line item");
    });

    it("should work with SYSTEM actor", async () => {
      const systemActor = createMockActor("SYSTEM");
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
        currency: "UYU",
      });
      const payment = createMockPayment({
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });
      const laborItem = createMockOrderLineItem({
        type: OrderLineItemType.LABOR,
        amount: 200,
      });
      const platformFeeItem = createMockOrderLineItem({
        type: OrderLineItemType.PLATFORM_FEE,
        amount: 20,
      });
      const earning = createMockEarning();

      mockOrderRepository.findById.mockResolvedValue(order);
      mockEarningRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([
        laborItem,
        platformFeeItem,
      ]);
      mockEarningRepository.createFromOrder.mockResolvedValue(earning);

      await service.createEarningForOrder(systemActor, "order-1");

      expect(mockEarningRepository.createFromOrder).toHaveBeenCalled();
    });
  });

  describe("markPayableIfDue", () => {
    it("should mark pending due earnings as payable", async () => {
      const now = new Date();
      const dueEarnings = [
        createMockEarning({
          id: "earning-1",
          status: "PENDING",
          availableAt: new Date(now.getTime() - 1000),
        }),
        createMockEarning({
          id: "earning-2",
          status: "PENDING",
          availableAt: new Date(now.getTime() - 2000),
        }),
      ];
      const updatedEarnings = [
        createMockEarning({ id: "earning-1", status: "PAYABLE" }),
        createMockEarning({ id: "earning-2", status: "PAYABLE" }),
      ];

      mockEarningRepository.listPendingDue.mockResolvedValue(dueEarnings);
      mockEarningRepository.markManyStatus.mockResolvedValue(updatedEarnings);

      const count = await service.markPayableIfDue(now);

      expect(count).toBe(2);
      expect(mockEarningRepository.listPendingDue).toHaveBeenCalledWith(now);
      expect(mockEarningRepository.markManyStatus).toHaveBeenCalledWith(
        ["earning-1", "earning-2"],
        "PAYABLE"
      );
    });

    it("should return 0 if no pending due earnings", async () => {
      const now = new Date();

      mockEarningRepository.listPendingDue.mockResolvedValue([]);

      const count = await service.markPayableIfDue(now);

      expect(count).toBe(0);
      expect(mockEarningRepository.markManyStatus).not.toHaveBeenCalled();
    });

    it("should use current date if no date provided", async () => {
      const dueEarnings = [
        createMockEarning({ id: "earning-1", status: "PENDING" }),
      ];

      mockEarningRepository.listPendingDue.mockResolvedValue(dueEarnings);
      mockEarningRepository.markManyStatus.mockResolvedValue([
        createMockEarning({ id: "earning-1", status: "PAYABLE" }),
      ]);

      const count = await service.markPayableIfDue();

      expect(count).toBe(1);
      expect(mockEarningRepository.listPendingDue).toHaveBeenCalled();
    });
  });
});

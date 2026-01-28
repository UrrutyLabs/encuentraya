import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    OrderLineItemRepository: "OrderLineItemRepository",
    OrderService: "OrderService",
    PaymentServiceFactory: "PaymentServiceFactory",
    PaymentRepository: "PaymentRepository",
    EarningService: "EarningService",
  },
}));

import { OrderFinalizationService } from "../order.finalization.service";
import type { OrderRepository, OrderEntity } from "../order.repo";
import type {
  OrderLineItemRepository,
  OrderLineItemEntity,
} from "../orderLineItem.repo";
import type {
  PaymentRepository,
  PaymentEntity,
} from "@modules/payment/payment.repo";
import type { EarningService } from "@modules/payout/earning.service";
import { OrderService } from "../order.service";
import type { Order } from "@repo/domain";
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  PaymentType,
  ApprovalMethod,
  OrderLineItemType,
  Category,
  PricingMode,
  DisputeStatus,
} from "@repo/domain";
import type { PaymentServiceFactory } from "@modules/payment";

describe("OrderFinalizationService", () => {
  let service: OrderFinalizationService;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockOrderLineItemRepository: ReturnType<
    typeof createMockOrderLineItemRepository
  >;
  let mockOrderService: ReturnType<typeof createMockOrderService>;
  let mockPaymentServiceFactory: ReturnType<
    typeof createMockPaymentServiceFactory
  >;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockEarningService: ReturnType<typeof createMockEarningService>;

  function createMockOrderRepository(): {
    update: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      update: vi.fn(),
      updateStatus: vi.fn(),
    };
  }

  function createMockOrderLineItemRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
    replaceOrderLineItems: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
      replaceOrderLineItems: vi.fn(),
    };
  }

  function createMockOrderService(): {
    getOrderOrThrow: ReturnType<typeof vi.fn>;
  } {
    return {
      getOrderOrThrow: vi.fn(),
    };
  }

  function createMockPaymentServiceFactory(): PaymentServiceFactory {
    return vi.fn() as unknown as PaymentServiceFactory;
  }

  function createMockPaymentRepository(): {
    findByOrderId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByOrderId: vi.fn(),
    };
  }

  function createMockEarningService(): {
    createEarningForOrder: ReturnType<typeof vi.fn>;
  } {
    return {
      createEarningForOrder: vi.fn(),
    };
  }

  function createMockOrder(overrides?: Partial<Order>): Order {
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
      scheduledWindowStartAt: new Date(),
      scheduledWindowEndAt: null,
      status: OrderStatus.AWAITING_CLIENT_APPROVAL,
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
      estimatedHours: 2,
      finalHoursSubmitted: 3,
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

  function createMockOrderEntity(
    overrides?: Partial<OrderEntity>
  ): OrderEntity {
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
      scheduledWindowStartAt: new Date(),
      scheduledWindowEndAt: null,
      status: OrderStatus.AWAITING_CLIENT_APPROVAL,
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
      estimatedHours: 2,
      finalHoursSubmitted: 3,
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

  function createMockOrderLineItem(
    overrides?: Partial<OrderLineItemEntity>
  ): OrderLineItemEntity {
    return {
      id: "line-item-1",
      orderId: "order-1",
      type: OrderLineItemType.LABOR,
      description: "Labor (3 horas × 100 UYU/hora)",
      quantity: 3,
      unitAmount: 100,
      amount: 300,
      currency: "UYU",
      taxBehavior: "taxable",
      taxRate: null,
      metadata: null,
      createdAt: new Date(),
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
      status: PaymentStatus.AUTHORIZED,
      orderId: "order-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      currency: "UYU",
      amountEstimated: 30000,
      amountAuthorized: 30000,
      amountCaptured: null,
      providerReference: null,
      checkoutUrl: null,
      idempotencyKey: "order-1-key",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockPaymentService(): {
    capturePayment: ReturnType<typeof vi.fn>;
  } {
    return {
      capturePayment: vi.fn(),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderRepository = createMockOrderRepository();
    mockOrderLineItemRepository = createMockOrderLineItemRepository();
    mockOrderService = createMockOrderService();
    mockPaymentServiceFactory = createMockPaymentServiceFactory();
    mockPaymentRepository = createMockPaymentRepository();
    mockEarningService = createMockEarningService();

    service = new OrderFinalizationService(
      mockOrderRepository as unknown as OrderRepository,
      mockOrderLineItemRepository as unknown as OrderLineItemRepository,
      mockOrderService as unknown as OrderService,
      mockPaymentServiceFactory,
      mockPaymentRepository as unknown as PaymentRepository,
      mockEarningService as unknown as EarningService
    );
  });

  describe("finalizeOrder", () => {
    it("should finalize order successfully", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        finalHoursSubmitted: 3,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
        approvalMethod: ApprovalMethod.CLIENT_ACCEPTED,
      });
      const laborItem = createMockOrderLineItem({
        type: OrderLineItemType.LABOR,
        amount: 300,
      });
      const platformFeeItem = createMockOrderLineItem({
        type: OrderLineItemType.PLATFORM_FEE,
        amount: 30,
      });
      const taxItem = createMockOrderLineItem({
        type: OrderLineItemType.TAX,
        amount: 72.6,
      });
      const finalizedOrderEntity = createMockOrderEntity({
        status: OrderStatus.COMPLETED,
        subtotalAmount: 330,
        platformFeeAmount: 30,
        taxAmount: 72.6,
        totalAmount: 402.6,
      });
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
        subtotalAmount: 330,
        platformFeeAmount: 30,
        taxAmount: 72.6,
        totalAmount: 402.6,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([
        laborItem,
        platformFeeItem,
        taxItem,
      ]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([
        laborItem,
        platformFeeItem,
        taxItem,
      ]);
      mockOrderRepository.update
        .mockResolvedValueOnce(updatedOrderEntity)
        .mockResolvedValueOnce(finalizedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue(finalizedOrderEntity);
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      const result = await service.finalizeOrder(
        "order-1",
        3,
        ApprovalMethod.CLIENT_ACCEPTED
      );

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(result.subtotalAmount).toBe(330);
      expect(result.platformFeeAmount).toBe(30);
      expect(result.taxAmount).toBe(72.6);
      expect(result.totalAmount).toBe(402.6);
      expect(mockOrderRepository.update).toHaveBeenCalledTimes(2);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.COMPLETED
      );
    });

    it("should create line items correctly", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        finalHoursSubmitted: 3,
        hourlyRateSnapshotAmount: 100,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
      });
      const laborItem = createMockOrderLineItem({
        type: OrderLineItemType.LABOR,
        amount: 300,
      });
      const platformFeeItem = createMockOrderLineItem({
        type: OrderLineItemType.PLATFORM_FEE,
        amount: 30,
      });
      const taxItem = createMockOrderLineItem({
        type: OrderLineItemType.TAX,
        amount: 72.6,
      });
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([
        laborItem,
        platformFeeItem,
        taxItem,
      ]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([
        laborItem,
        platformFeeItem,
        taxItem,
      ]);
      mockOrderRepository.update.mockResolvedValueOnce(updatedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...updatedOrderEntity,
        status: OrderStatus.COMPLETED,
      } as OrderEntity);
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      await service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED);

      expect(
        mockOrderLineItemRepository.replaceOrderLineItems
      ).toHaveBeenCalledWith(
        "order-1",
        expect.arrayContaining([
          expect.objectContaining({
            type: OrderLineItemType.LABOR,
            amount: 300,
          }),
          expect.objectContaining({
            type: OrderLineItemType.PLATFORM_FEE,
            amount: 30,
          }),
          expect.objectContaining({
            type: OrderLineItemType.TAX,
          }),
        ])
      );
    });

    it("should capture payment and create earning if payment is authorized", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const paymentService = createMockPaymentService();
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([]);
      mockOrderRepository.update.mockResolvedValueOnce(updatedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...updatedOrderEntity,
        status: OrderStatus.COMPLETED,
      } as OrderEntity);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPaymentServiceFactory as any).mockResolvedValue(paymentService);
      paymentService.capturePayment.mockResolvedValue(undefined);
      mockEarningService.createEarningForOrder.mockResolvedValue(undefined);
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      await service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED);

      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      expect(paymentService.capturePayment).toHaveBeenCalledWith("payment-1");
      expect(mockEarningService.createEarningForOrder).toHaveBeenCalledWith(
        { role: "SYSTEM" },
        "order-1"
      );
    });

    it("should not fail if payment capture fails", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const paymentService = createMockPaymentService();
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([]);
      mockOrderRepository.update.mockResolvedValueOnce(updatedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...updatedOrderEntity,
        status: OrderStatus.COMPLETED,
      } as OrderEntity);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPaymentServiceFactory as any).mockResolvedValue(paymentService);
      paymentService.capturePayment.mockRejectedValue(
        new Error("Capture failed")
      );
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      // Should not throw
      await service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED);

      expect(paymentService.capturePayment).toHaveBeenCalled();
      expect(mockEarningService.createEarningForOrder).not.toHaveBeenCalled();
    });

    it("should not fail if earning creation fails", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const paymentService = createMockPaymentService();
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([]);
      mockOrderRepository.update.mockResolvedValueOnce(updatedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...updatedOrderEntity,
        status: OrderStatus.COMPLETED,
      } as OrderEntity);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPaymentServiceFactory as any).mockResolvedValue(paymentService);
      paymentService.capturePayment.mockResolvedValue(undefined);
      mockEarningService.createEarningForOrder.mockRejectedValue(
        new Error("Earning creation failed")
      );
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      // Should not throw
      await service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED);

      expect(mockEarningService.createEarningForOrder).toHaveBeenCalled();
    });

    it("should throw error if order is already finalized", async () => {
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(
        service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED)
      ).rejects.toThrow("Order order-1 is already finalized");
    });

    it("should throw error if order is not in AWAITING_CLIENT_APPROVAL status", async () => {
      const order = createMockOrder({
        status: OrderStatus.IN_PROGRESS,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(
        service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED)
      ).rejects.toThrow("Invalid state transition");
    });

    it("should not capture payment if payment is not authorized", async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
      });
      const updatedOrderEntity = createMockOrderEntity({
        approvedHours: 3,
      });
      const payment = createMockPayment({
        status: PaymentStatus.CREATED,
      });
      const finalizedOrder = createMockOrder({
        status: OrderStatus.COMPLETED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderLineItemRepository.replaceOrderLineItems.mockResolvedValue([]);
      mockOrderLineItemRepository.findByOrderId.mockResolvedValue([]);
      mockOrderRepository.update.mockResolvedValueOnce(updatedOrderEntity);
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...updatedOrderEntity,
        status: OrderStatus.COMPLETED,
      } as OrderEntity);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderService.getOrderOrThrow
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(finalizedOrder);

      await service.finalizeOrder("order-1", 3, ApprovalMethod.CLIENT_ACCEPTED);

      expect(mockPaymentServiceFactory).not.toHaveBeenCalled();
    });
  });
});

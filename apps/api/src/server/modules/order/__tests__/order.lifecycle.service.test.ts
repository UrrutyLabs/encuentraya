import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    OrderService: "OrderService",
    ProRepository: "ProRepository",
    PaymentServiceFactory: "PaymentServiceFactory",
    PaymentRepository: "PaymentRepository",
  },
}));

import { OrderLifecycleService } from "../order.lifecycle.service";
import type { OrderRepository, OrderEntity } from "../order.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type {
  PaymentRepository,
  PaymentEntity,
} from "@modules/payment/payment.repo";
import { OrderService } from "../order.service";
import type { Order } from "@repo/domain";
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  PaymentType,
  Category,
  Role,
  DisputeStatus,
  ApprovalMethod,
  PricingMode,
} from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import type { PaymentServiceFactory } from "@modules/payment";
import {
  InvalidOrderStateError,
  UnauthorizedOrderActionError,
} from "../order.errors";

describe("OrderLifecycleService", () => {
  let service: OrderLifecycleService;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockOrderService: ReturnType<typeof createMockOrderService>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockPaymentServiceFactory: ReturnType<
    typeof createMockPaymentServiceFactory
  >;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;

  function createMockOrderRepository(): {
    update: ReturnType<typeof vi.fn>;
  } {
    return {
      update: vi.fn(),
    };
  }

  function createMockOrderService(): {
    getOrderOrThrow: ReturnType<typeof vi.fn>;
    getOrderById: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      getOrderOrThrow: vi.fn(),
      getOrderById: vi.fn(),
      updateOrderStatus: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
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

  function createMockActor(role: Role = Role.CLIENT, id = "user-1"): Actor {
    return { id, role };
  }

  function createMockProProfile(
    overrides?: Partial<ProProfileEntity>
  ): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "pro-user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: null,
      bio: null,
      avatarUrl: null,
      hourlyRate: 100,
      categories: [],
      serviceArea: null,
      status: "active",
      profileCompleted: false,
      completedJobsCount: 0,
      isTopPro: false,
      responseTimeMinutes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
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
      status: OrderStatus.PENDING_PRO_CONFIRMATION,
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
      amountEstimated: 20000,
      amountAuthorized: 20000,
      amountCaptured: null,
      providerReference: null,
      checkoutUrl: null,
      idempotencyKey: "order-1-key",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderRepository = createMockOrderRepository();
    mockOrderService = createMockOrderService();
    mockProRepository = createMockProRepository();
    mockPaymentServiceFactory = createMockPaymentServiceFactory();
    mockPaymentRepository = createMockPaymentRepository();

    service = new OrderLifecycleService(
      mockOrderRepository as unknown as OrderRepository,
      mockOrderService as unknown as OrderService,
      mockProRepository as unknown as ProRepository,
      mockPaymentServiceFactory,
      mockPaymentRepository as unknown as PaymentRepository
    );
  });

  describe("acceptOrder", () => {
    it("should accept order successfully", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.acceptOrder(actor, "order-1");

      expect(result.status).toBe(OrderStatus.ACCEPTED);
      expect(mockOrderService.getOrderOrThrow).toHaveBeenCalledWith("order-1");
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith("pro-user-1");
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.ACCEPTED
      );
    });

    it("should throw error if pro profile not found", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(null);

      await expect(service.acceptOrder(actor, "order-1")).rejects.toThrow(
        UnauthorizedOrderActionError
      );
      await expect(service.acceptOrder(actor, "order-1")).rejects.toThrow(
        "Pro profile not found"
      );
    });

    it("should throw error if order does not belong to pro", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        proProfileId: "pro-2",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.acceptOrder(actor, "order-1")).rejects.toThrow(
        UnauthorizedOrderActionError
      );
      await expect(service.acceptOrder(actor, "order-1")).rejects.toThrow(
        "Order is not assigned to this pro"
      );
    });

    it("should throw error if order is not in PENDING_PRO_CONFIRMATION status", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.acceptOrder(actor, "order-1")).rejects.toThrow(
        InvalidOrderStateError
      );
    });
  });

  describe("confirmOrder", () => {
    it("should confirm order successfully", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        clientUserId: "client-1",
      });
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.CONFIRMED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.confirmOrder(actor, "order-1");

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockOrderService.getOrderOrThrow).toHaveBeenCalledWith("order-1");
      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CONFIRMED
      );
    });

    it("should throw error if order does not belong to client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        clientUserId: "client-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(service.confirmOrder(actor, "order-1")).rejects.toThrow(
        UnauthorizedOrderActionError
      );
      await expect(service.confirmOrder(actor, "order-1")).rejects.toThrow(
        "Order does not belong to this client"
      );
    });

    it("should throw error if order is not in ACCEPTED status", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        clientUserId: "client-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(service.confirmOrder(actor, "order-1")).rejects.toThrow(
        InvalidOrderStateError
      );
    });

    it("should throw error if payment not found", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        clientUserId: "client-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);

      await expect(service.confirmOrder(actor, "order-1")).rejects.toThrow(
        "Payment not found for order order-1"
      );
    });

    it("should throw error if payment is not AUTHORIZED", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        clientUserId: "client-1",
      });
      const payment = createMockPayment({
        status: PaymentStatus.CREATED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(payment);

      await expect(service.confirmOrder(actor, "order-1")).rejects.toThrow(
        "Payment for order order-1 must be AUTHORIZED before confirming"
      );
    });
  });

  describe("markInProgress", () => {
    it("should mark order as in progress successfully", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.CONFIRMED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.IN_PROGRESS,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.markInProgress(actor, "order-1");

      expect(result.status).toBe(OrderStatus.IN_PROGRESS);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.IN_PROGRESS
      );
    });

    it("should throw error if order is not in CONFIRMED status", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.markInProgress(actor, "order-1")).rejects.toThrow(
        InvalidOrderStateError
      );
    });
  });

  describe("markArrived", () => {
    it("should mark order as arrived successfully", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.IN_PROGRESS,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });
      const updatedOrderEntity = {
        ...order,
        arrivedAt: new Date(),
      } as OrderEntity;
      const updatedOrder = createMockOrder({
        arrivedAt: new Date(),
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockOrderRepository.update.mockResolvedValue(updatedOrderEntity);
      mockOrderService.getOrderById.mockResolvedValue(updatedOrder);

      const result = await service.markArrived(actor, "order-1");

      expect(result.arrivedAt).toBeDefined();
      expect(mockOrderRepository.update).toHaveBeenCalledWith("order-1", {
        arrivedAt: expect.any(Date),
      });
    });

    it("should throw error if order is not in IN_PROGRESS status", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.CONFIRMED,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.markArrived(actor, "order-1")).rejects.toThrow(
        "Order order-1 is not in IN_PROGRESS status"
      );
    });
  });

  describe("submitHours", () => {
    it("should submit hours successfully", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.IN_PROGRESS,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        finalHoursSubmitted: 3,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockOrderRepository.update.mockResolvedValue({
        ...order,
        finalHoursSubmitted: 3,
      } as OrderEntity);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.submitHours(actor, "order-1", 3);

      expect(result.status).toBe(OrderStatus.AWAITING_CLIENT_APPROVAL);
      expect(mockOrderRepository.update).toHaveBeenCalledWith("order-1", {
        finalHoursSubmitted: 3,
        completedAt: expect.any(Date),
      });
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.AWAITING_CLIENT_APPROVAL
      );
    });

    it("should throw error if final hours is not greater than 0", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.IN_PROGRESS,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      await expect(service.submitHours(actor, "order-1", 0)).rejects.toThrow(
        "Final hours must be greater than 0"
      );
    });
  });

  describe("approveHours", () => {
    it("should approve hours successfully", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        clientUserId: "client-1",
        finalHoursSubmitted: 3,
      });
      const updatedOrder = createMockOrder({
        approvedHours: 3,
        approvalMethod: ApprovalMethod.CLIENT_ACCEPTED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue({
        ...order,
        approvedHours: 3,
        approvalMethod: "client_accepted",
      } as OrderEntity);
      mockOrderService.getOrderById.mockResolvedValue(updatedOrder);

      const result = await service.approveHours(actor, "order-1");

      expect(result.approvedHours).toBe(3);
      expect(result.approvalMethod).toBe("client_accepted");
      expect(mockOrderRepository.update).toHaveBeenCalledWith("order-1", {
        approvedHours: 3,
        approvalMethod: "client_accepted",
      });
    });

    it("should throw error if final hours not submitted", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        clientUserId: "client-1",
        finalHoursSubmitted: null,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(service.approveHours(actor, "order-1")).rejects.toThrow(
        "Final hours must be submitted before approval"
      );
    });
  });

  describe("disputeHours", () => {
    it("should dispute hours successfully", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.AWAITING_CLIENT_APPROVAL,
        clientUserId: "client-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.DISPUTED,
        disputeReason: "Hours seem incorrect",
        disputeOpenedBy: "client-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.disputeHours(
        actor,
        "order-1",
        "Hours seem incorrect"
      );

      expect(result.status).toBe(OrderStatus.DISPUTED);
      expect(result.disputeReason).toBe("Hours seem incorrect");
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.DISPUTED,
        {
          disputeReason: "Hours seem incorrect",
          disputeOpenedBy: "client-1",
        }
      );
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order successfully as client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        clientUserId: "client-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.CANCELED,
        cancelReason: "Changed my mind",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.cancelOrder(
        actor,
        "order-1",
        "Changed my mind"
      );

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CANCELED,
        { cancelReason: "Changed my mind" }
      );
    });

    it("should cancel order successfully as pro", async () => {
      const actor = createMockActor(Role.PRO, "pro-user-1");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        proProfileId: "pro-1",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: "pro-user-1",
      });
      const updatedOrder = createMockOrder({
        status: OrderStatus.CANCELED,
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await service.cancelOrder(actor, "order-1");

      expect(result.status).toBe(OrderStatus.CANCELED);
    });

    it("should throw error if order cannot be canceled", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        status: OrderStatus.COMPLETED,
        clientUserId: "client-1",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);

      await expect(service.cancelOrder(actor, "order-1")).rejects.toThrow(
        InvalidOrderStateError
      );
    });

    it("should throw error if user does not own order", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
        clientUserId: "client-1",
        proProfileId: "pro-2",
      });

      mockOrderService.getOrderOrThrow.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(null);

      await expect(service.cancelOrder(actor, "order-1")).rejects.toThrow(
        UnauthorizedOrderActionError
      );
      await expect(service.cancelOrder(actor, "order-1")).rejects.toThrow(
        "Order does not belong to this user"
      );
    });
  });
});

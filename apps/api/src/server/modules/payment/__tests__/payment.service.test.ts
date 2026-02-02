import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentService } from "../payment.service";
import type { PaymentRepository, PaymentEntity } from "../payment.repo";
import type {
  PaymentEventRepository,
  PaymentEventEntity,
} from "../paymentEvent.repo";

import type { OrderRepository, OrderEntity } from "@modules/order/order.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { EarningService } from "@modules/payout/earning.service";
import type { AuditService } from "@modules/audit/audit.service";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { PaymentProviderClient } from "../provider";
import {
  PaymentProvider,
  PaymentType,
  PaymentStatus,
  OrderStatus,
  Role,
} from "@repo/domain";
import { OrderNotFoundError } from "@modules/order/order.errors";
import type { Actor } from "@infra/auth/roles";
import { getPaymentProviderClient } from "../registry";

vi.mock("../registry", () => ({
  getPaymentProviderClient: vi.fn(),
}));

describe("PaymentService", () => {
  let service: PaymentService;
  let mockPaymentRepository: ReturnType<typeof createMockPaymentRepository>;
  let mockPaymentEventRepository: ReturnType<
    typeof createMockPaymentEventRepository
  >;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockEarningService: ReturnType<typeof createMockEarningService>;
  let mockAuditService: ReturnType<typeof createMockAuditService>;
  let mockClientProfileService: ReturnType<
    typeof createMockClientProfileService
  >;
  let mockProviderClient: ReturnType<typeof createMockProviderClient>;

  function createMockPaymentRepository(): {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByOrderId: ReturnType<typeof vi.fn>;
    findByProviderReference: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    updateStatusAndAmounts: ReturnType<typeof vi.fn>;
    setCheckoutUrl: ReturnType<typeof vi.fn>;
    setProviderReference: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByProviderReference: vi.fn(),
      findAll: vi.fn(),
      updateStatusAndAmounts: vi.fn(),
      setCheckoutUrl: vi.fn(),
      setProviderReference: vi.fn(),
    };
  }

  function createMockPaymentEventRepository(): {
    createEvent: ReturnType<typeof vi.fn>;
    findByPaymentId: ReturnType<typeof vi.fn>;
  } {
    return {
      createEvent: vi.fn(),
      findByPaymentId: vi.fn(),
    };
  }

  function createMockOrderRepository(): {
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockEarningService(): {
    createEarningForOrder: ReturnType<typeof vi.fn>;
  } {
    return {
      createEarningForOrder: vi.fn(),
    };
  }

  function createMockAuditService(): {
    logEvent: ReturnType<typeof vi.fn>;
  } {
    return {
      logEvent: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    getProfile: ReturnType<typeof vi.fn>;
  } {
    return {
      getProfile: vi.fn(),
    };
  }

  function createMockProviderClient(): PaymentProviderClient {
    return {
      createPreauth: vi.fn(),
      parseWebhook: vi.fn(),
      fetchPaymentStatus: vi.fn(),
      capture: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
    return { id, role };
  }

  function createMockProProfile(
    overrides?: Partial<ProProfileEntity>
  ): ProProfileEntity {
    const base: ProProfileEntity = {
      id: "pro-1",
      userId: "user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: null,
      bio: null,
      avatarUrl: null,
      hourlyRate: 10000, // 100 UYU/hour in minor units (cents)
      categoryIds: [],
      serviceArea: null,
      status: "active",
      profileCompleted: false,
      completedJobsCount: 0,
      isTopPro: false,
      responseTimeMinutes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return {
      ...base,
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
      status: PaymentStatus.CREATED,
      orderId: "order-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      currency: "UYU",
      amountEstimated: 20000,
      amountAuthorized: null,
      amountCaptured: null,
      providerReference: null,
      checkoutUrl: null,
      idempotencyKey: "order-1-1234567890",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockOrder(overrides?: Partial<OrderEntity>): OrderEntity {
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
      status: OrderStatus.ACCEPTED,
      acceptedAt: new Date(),
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
      disputeStatus: "none",
      disputeReason: null,
      disputeOpenedBy: null,
      isFirstOrder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockPaymentEvent(
    overrides?: Partial<PaymentEventEntity>
  ): PaymentEventEntity {
    return {
      id: "event-1",
      paymentId: "payment-1",
      provider: PaymentProvider.MERCADO_PAGO,
      eventType: "payment.created",
      raw: {},
      createdAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockPaymentRepository = createMockPaymentRepository();
    mockPaymentEventRepository = createMockPaymentEventRepository();
    mockOrderRepository = createMockOrderRepository();
    mockProRepository = createMockProRepository();
    mockEarningService = createMockEarningService();
    mockAuditService = createMockAuditService();
    mockClientProfileService = createMockClientProfileService();
    mockProviderClient = createMockProviderClient();

    vi.mocked(getPaymentProviderClient).mockResolvedValue(mockProviderClient);

    service = new PaymentService(
      mockProviderClient,
      PaymentProvider.MERCADO_PAGO,
      mockPaymentRepository as unknown as PaymentRepository,
      mockPaymentEventRepository as unknown as PaymentEventRepository,
      mockOrderRepository as unknown as OrderRepository,
      mockProRepository as unknown as ProRepository,
      mockEarningService as unknown as EarningService,
      mockAuditService as unknown as AuditService,
      mockClientProfileService as unknown as ClientProfileService
    );
  });

  describe("getProviderClient", () => {
    it("should return the provider client", () => {
      const client = service.getProviderClient();
      expect(client).toBe(mockProviderClient);
    });
  });

  describe("createPreauthForOrder", () => {
    it("should create a preauthorization for an order", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        id: "order-1",
        clientUserId: "client-1",
        status: OrderStatus.ACCEPTED,
        proProfileId: "pro-1",
        hourlyRateSnapshotAmount: 100,
        estimatedHours: 2,
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        hourlyRate: 10000, // 100 UYU/hour in minor units (cents)
      });
      const payment = createMockPayment({
        id: "payment-1",
        orderId: "order-1",
        status: PaymentStatus.REQUIRES_ACTION,
        checkoutUrl: "https://checkout.example.com",
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockPaymentRepository.create.mockResolvedValue(payment);
      vi.mocked(mockClientProfileService.getProfile).mockResolvedValue({
        id: "profile-1",
        userId: "client-1",
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        preferredContactMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockProviderClient.createPreauth).mockResolvedValue({
        providerReference: "mp-ref-123",
        checkoutUrl: "https://checkout.example.com",
        status: PaymentStatus.REQUIRES_ACTION,
      });
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.REQUIRES_ACTION,
        providerReference: "mp-ref-123",
        checkoutUrl: "https://checkout.example.com",
      });

      const result = await service.createPreauthForOrder(actor, {
        orderId: "order-1",
      });

      expect(result.paymentId).toBe("payment-1");
      expect(result.checkoutUrl).toBe("https://checkout.example.com");
      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order-1");
      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
        "order-1"
      );
      // Note: createPreauthForOrder uses hourlyRateSnapshotAmount from order, not pro profile
      expect(mockProRepository.findById).not.toHaveBeenCalled();
      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(mockProviderClient.createPreauth).toHaveBeenCalled();
      expect(mockPaymentRepository.updateStatusAndAmounts).toHaveBeenCalled();
    });

    it("should throw error if actor is not a client", async () => {
      const actor = createMockActor(Role.PRO);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow("Only clients can create payments");
    });

    it("should throw error if order not found", async () => {
      const actor = createMockActor(Role.CLIENT);
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow(OrderNotFoundError);
    });

    it("should throw error if order does not belong to client", async () => {
      const actor = createMockActor(Role.CLIENT, "client-2");
      const order = createMockOrder({
        clientUserId: "client-1",
      });
      mockOrderRepository.findById.mockResolvedValue(order);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow("Order does not belong to this client");
    });

    it("should throw error if order is not in ACCEPTED status", async () => {
      const actor = createMockActor(Role.CLIENT);
      const order = createMockOrder({
        status: OrderStatus.PENDING_PRO_CONFIRMATION,
      });
      mockOrderRepository.findById.mockResolvedValue(order);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow("Order must be in ACCEPTED status");
    });

    it("should return existing payment if it is in valid state", async () => {
      const actor = createMockActor(Role.CLIENT);
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });
      const existingPayment = createMockPayment({
        status: PaymentStatus.CREATED,
        checkoutUrl: "https://existing-checkout.com",
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(existingPayment);

      const result = await service.createPreauthForOrder(actor, {
        orderId: "order-1",
      });

      expect(result.paymentId).toBe("payment-1");
      expect(result.checkoutUrl).toBe("https://existing-checkout.com");
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error if existing payment is in invalid state", async () => {
      const actor = createMockActor(Role.CLIENT);
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });
      const existingPayment = createMockPayment({
        status: PaymentStatus.CAPTURED,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(existingPayment);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow("Payment already exists for this order");
    });

    it("should handle provider client failure", async () => {
      const actor = createMockActor(Role.CLIENT);
      const order = createMockOrder({
        status: OrderStatus.ACCEPTED,
      });
      const payment = createMockPayment();

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.create.mockResolvedValue(payment);
      vi.mocked(mockProviderClient.createPreauth).mockRejectedValue(
        new Error("Provider error")
      );

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow("Provider error");

      expect(mockPaymentRepository.updateStatusAndAmounts).toHaveBeenCalledWith(
        payment.id,
        { status: PaymentStatus.FAILED }
      );
    });

    it("should use quotedAmountCents for fixed-price order when quote accepted", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        id: "order-1",
        clientUserId: "client-1",
        status: OrderStatus.ACCEPTED,
        pricingMode: "fixed",
        quotedAmountCents: 55000,
        quoteAcceptedAt: new Date(),
        estimatedHours: null,
        hourlyRateSnapshotAmount: 0,
      });
      const payment = createMockPayment({
        id: "payment-1",
        orderId: "order-1",
        status: PaymentStatus.REQUIRES_ACTION,
        checkoutUrl: "https://checkout.example.com",
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);
      mockPaymentRepository.create.mockResolvedValue(payment);
      vi.mocked(mockClientProfileService.getProfile).mockResolvedValue({
        id: "profile-1",
        userId: "client-1",
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        preferredContactMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockProviderClient.createPreauth).mockResolvedValue({
        providerReference: "mp-ref-123",
        checkoutUrl: "https://checkout.example.com",
        status: PaymentStatus.REQUIRES_ACTION,
      });
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.REQUIRES_ACTION,
        providerReference: "mp-ref-123",
        checkoutUrl: "https://checkout.example.com",
      });

      const result = await service.createPreauthForOrder(actor, {
        orderId: "order-1",
      });

      expect(result.paymentId).toBe("payment-1");
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amountEstimated: 55000,
        })
      );
      const createPreauthCall = vi.mocked(mockProviderClient.createPreauth).mock
        .calls[0]?.[0];
      expect(createPreauthCall).toBeDefined();
      expect(
        createPreauthCall?.amount?.amount ?? createPreauthCall?.amount
      ).toBe(55000);
    });

    it("should throw for fixed-price order when quote not accepted", async () => {
      const actor = createMockActor(Role.CLIENT, "client-1");
      const order = createMockOrder({
        id: "order-1",
        clientUserId: "client-1",
        status: OrderStatus.ACCEPTED,
        pricingMode: "fixed",
        quotedAmountCents: 55000,
        quoteAcceptedAt: null,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);

      await expect(
        service.createPreauthForOrder(actor, { orderId: "order-1" })
      ).rejects.toThrow(
        "Quote must be submitted and accepted before authorizing payment for fixed-price orders"
      );
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("handleProviderWebhook", () => {
    it("should handle webhook event and update payment status", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.REQUIRES_ACTION,
        providerReference: "mp-ref-123",
        orderId: "order-1",
      });
      const order = createMockOrder({
        id: "order-1",
        status: OrderStatus.ACCEPTED,
      });
      const event = createMockPaymentEvent();

      mockPaymentRepository.findByProviderReference.mockResolvedValue(payment);
      mockPaymentEventRepository.createEvent.mockResolvedValue(event);
      vi.mocked(mockProviderClient.fetchPaymentStatus).mockResolvedValue({
        status: PaymentStatus.AUTHORIZED,
        authorizedAmount: 20000,
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.AUTHORIZED,
        amountAuthorized: 20000,
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...order,
        status: OrderStatus.CONFIRMED,
      });

      await service.handleProviderWebhook({
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: "mp-ref-123",
        eventType: "payment.authorized",
        raw: {},
      });

      expect(
        mockPaymentRepository.findByProviderReference
      ).toHaveBeenCalledWith(PaymentProvider.MERCADO_PAGO, "mp-ref-123");
      expect(mockPaymentEventRepository.createEvent).toHaveBeenCalled();
      expect(mockProviderClient.fetchPaymentStatus).toHaveBeenCalledWith(
        "mp-ref-123"
      );
      expect(mockPaymentRepository.updateStatusAndAmounts).toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CONFIRMED
      );
    });

    it("should not throw if payment not found", async () => {
      mockPaymentRepository.findByProviderReference.mockResolvedValue(null);

      await service.handleProviderWebhook({
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: "mp-ref-123",
        eventType: "payment.authorized",
        raw: {},
      });

      expect(mockPaymentEventRepository.createEvent).not.toHaveBeenCalled();
    });

    it("should not update if status transition is invalid", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.FAILED,
        providerReference: "mp-ref-123",
      });

      mockPaymentRepository.findByProviderReference.mockResolvedValue(payment);
      mockPaymentEventRepository.createEvent.mockResolvedValue(
        createMockPaymentEvent()
      );
      vi.mocked(mockProviderClient.fetchPaymentStatus).mockResolvedValue({
        status: PaymentStatus.AUTHORIZED,
      });

      await service.handleProviderWebhook({
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: "mp-ref-123",
        eventType: "payment.authorized",
        raw: {},
      });

      expect(
        mockPaymentRepository.updateStatusAndAmounts
      ).not.toHaveBeenCalled();
    });

    it("should not create earning when payment is captured (earning is created in OrderFinalizationService)", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
        providerReference: "mp-ref-123",
        orderId: "order-1",
      });
      const order = createMockOrder({
        id: "order-1",
        status: OrderStatus.COMPLETED,
      });
      const event = createMockPaymentEvent();

      mockPaymentRepository.findByProviderReference.mockResolvedValue(payment);
      mockPaymentEventRepository.createEvent.mockResolvedValue(event);
      vi.mocked(mockProviderClient.fetchPaymentStatus).mockResolvedValue({
        status: PaymentStatus.CAPTURED,
        capturedAmount: 20000,
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });

      await service.handleProviderWebhook({
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: "mp-ref-123",
        eventType: "payment.captured",
        raw: {},
      });

      // Earning creation is now handled in OrderFinalizationService, not in webhook handler
      expect(mockEarningService.createEarningForOrder).not.toHaveBeenCalled();
    });
  });

  describe("capturePayment", () => {
    it("should capture an authorized payment", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
        providerReference: "mp-ref-123",
        amountAuthorized: 20000,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      vi.mocked(mockProviderClient.capture).mockResolvedValue({
        capturedAmount: 20000,
      });
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.CAPTURED,
        amountCaptured: 20000,
      });

      const result = await service.capturePayment("payment-1");

      expect(result.capturedAmount).toBe(20000);
      expect(mockProviderClient.capture).toHaveBeenCalledWith(
        "mp-ref-123",
        20000
      );
      expect(mockPaymentRepository.updateStatusAndAmounts).toHaveBeenCalledWith(
        "payment-1",
        {
          status: PaymentStatus.CAPTURED,
          amountCaptured: 20000,
        }
      );
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(service.capturePayment("payment-1")).rejects.toThrow(
        "Payment not found: payment-1"
      );
    });

    it("should throw error if payment is not AUTHORIZED", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.CREATED,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);

      await expect(service.capturePayment("payment-1")).rejects.toThrow(
        "Payment must be AUTHORIZED to capture"
      );
    });

    it("should throw error if payment has no provider reference", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
        providerReference: null,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);

      await expect(service.capturePayment("payment-1")).rejects.toThrow(
        "Payment payment-1 has no provider reference"
      );
    });

    it("should capture partial amount if specified", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.AUTHORIZED,
        providerReference: "mp-ref-123",
        amountAuthorized: 20000,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      vi.mocked(mockProviderClient.capture).mockResolvedValue({
        capturedAmount: 10000,
      });
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.CAPTURED,
        amountCaptured: 10000,
      });

      const result = await service.capturePayment("payment-1", 10000);

      expect(result.capturedAmount).toBe(10000);
      expect(mockProviderClient.capture).toHaveBeenCalledWith(
        "mp-ref-123",
        10000
      );
    });
  });

  describe("syncPaymentStatus", () => {
    it("should sync payment status with provider", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.REQUIRES_ACTION,
        providerReference: "mp-ref-123",
        orderId: "order-1",
      });
      const order = createMockOrder({
        id: "order-1",
        status: OrderStatus.ACCEPTED,
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      vi.mocked(mockProviderClient.fetchPaymentStatus).mockResolvedValue({
        status: PaymentStatus.AUTHORIZED,
        authorizedAmount: 20000,
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockPaymentRepository.updateStatusAndAmounts.mockResolvedValue({
        ...payment,
        status: PaymentStatus.AUTHORIZED,
        amountAuthorized: 20000,
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...order,
        status: OrderStatus.CONFIRMED,
      });
      vi.mocked(mockAuditService.logEvent).mockResolvedValue(undefined);

      const actor = createMockActor(Role.ADMIN);
      await service.syncPaymentStatus("payment-1", actor);

      expect(mockProviderClient.fetchPaymentStatus).toHaveBeenCalledWith(
        "mp-ref-123"
      );
      expect(mockPaymentRepository.updateStatusAndAmounts).toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        "order-1",
        OrderStatus.CONFIRMED
      );
      expect(mockAuditService.logEvent).toHaveBeenCalled();
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      const actor = createMockActor(Role.ADMIN);
      await expect(
        service.syncPaymentStatus("payment-1", actor)
      ).rejects.toThrow("Payment not found: payment-1");
    });

    it("should throw error if status transition is invalid", async () => {
      const payment = createMockPayment({
        status: PaymentStatus.FAILED,
        providerReference: "mp-ref-123",
      });

      mockPaymentRepository.findById.mockResolvedValue(payment);
      vi.mocked(mockProviderClient.fetchPaymentStatus).mockResolvedValue({
        status: PaymentStatus.AUTHORIZED,
      });

      const actor = createMockActor(Role.ADMIN);
      await expect(
        service.syncPaymentStatus("payment-1", actor)
      ).rejects.toThrow("Invalid status transition");
    });
  });

  describe("adminListPayments", () => {
    it("should list all payments", async () => {
      const payments = [
        createMockPayment({ id: "payment-1" }),
        createMockPayment({ id: "payment-2" }),
      ];

      mockPaymentRepository.findAll.mockResolvedValue(payments);

      const result = await service.adminListPayments();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("payment-1");
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it("should filter payments by status", async () => {
      const payments = [
        createMockPayment({ status: PaymentStatus.AUTHORIZED }),
      ];

      mockPaymentRepository.findAll.mockResolvedValue(payments);

      await service.adminListPayments({
        status: PaymentStatus.AUTHORIZED,
      });

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith({
        status: PaymentStatus.AUTHORIZED,
      });
    });
  });

  describe("adminGetPaymentById", () => {
    it("should get payment by ID with events", async () => {
      const payment = createMockPayment({ id: "payment-1" });
      const events = [
        createMockPaymentEvent({ id: "event-1" }),
        createMockPaymentEvent({ id: "event-2" }),
      ];

      mockPaymentRepository.findById.mockResolvedValue(payment);
      mockPaymentEventRepository.findByPaymentId.mockResolvedValue(events);

      const result = await service.adminGetPaymentById("payment-1");

      expect(result.id).toBe("payment-1");
      expect(result.events).toHaveLength(2);
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith("payment-1");
      expect(mockPaymentEventRepository.findByPaymentId).toHaveBeenCalledWith(
        "payment-1"
      );
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(service.adminGetPaymentById("payment-1")).rejects.toThrow(
        "Payment not found: payment-1"
      );
    });
  });
});

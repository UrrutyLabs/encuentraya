import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    ProRepository: "ProRepository",
    ProProfileCategoryRepository: "ProProfileCategoryRepository",
    ClientProfileService: "ClientProfileService",
    OrderService: "OrderService",
    CategoryRepository: "CategoryRepository",
    SubcategoryService: "SubcategoryService",
  },
}));

import { OrderCreationService } from "../order.creation.service";
import type { OrderRepository, OrderEntity } from "../order.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import { OrderService } from "../order.service";
import type { CategoryRepository } from "@modules/category/category.repo";
import type { SubcategoryService } from "@modules/subcategory/subcategory.service";
import type { ProProfileCategoryRepository } from "@modules/pro/proProfileCategory.repo";
import type {
  ApprovalMethod,
  DisputeStatus,
  Order,
  OrderCreateInput,
  PricingMode,
} from "@repo/domain";
import { OrderStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";

describe("OrderCreationService", () => {
  let service: OrderCreationService;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockClientProfileService: ReturnType<
    typeof createMockClientProfileService
  >;
  let mockOrderService: ReturnType<typeof createMockOrderService>;
  let mockCategoryRepository: ReturnType<typeof createMockCategoryRepository>;
  let mockSubcategoryService: ReturnType<typeof createMockSubcategoryService>;
  let mockProProfileCategoryRepository: ReturnType<
    typeof createMockProProfileCategoryRepository
  >;

  function createMockProProfileCategoryRepository(): {
    findByProProfileAndCategory: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileAndCategory: vi.fn(),
    };
  }

  function createMockOrderRepository(): {
    create: ReturnType<typeof vi.fn>;
    findByClientUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findByClientUserId: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockClientProfileService(): {
    ensureClientProfileExists: ReturnType<typeof vi.fn>;
  } {
    return {
      ensureClientProfileExists: vi.fn(),
    };
  }

  function createMockOrderService(): {
    getOrderById: ReturnType<typeof vi.fn>;
  } {
    return {
      getOrderById: vi.fn(),
    };
  }

  function createMockCategoryRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockSubcategoryService(): {
    validateSubcategoryBelongsToCategory: ReturnType<typeof vi.fn>;
    getSubcategoryById: ReturnType<typeof vi.fn>;
  } {
    return {
      validateSubcategoryBelongsToCategory: vi.fn(),
      getSubcategoryById: vi.fn(),
    };
  }

  function createMockActor(id = "client-1"): Actor {
    return { id, role: Role.CLIENT };
  }

  function createMockProProfile(
    overrides?: Partial<ProProfileEntity>
  ): ProProfileEntity {
    return {
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
      baseCountryCode: null,
      baseLatitude: null,
      baseLongitude: null,
      basePostalCode: null,
      baseAddressLine: null,
      serviceRadiusKm: 10,
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

  function createMockOrderEntity(
    overrides?: Partial<OrderEntity>
  ): OrderEntity {
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
      hourlyRateSnapshotAmount: 10000, // 100 UYU/hour in minor units (cents)
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

  function createMockOrder(overrides?: Partial<Order>): Order {
    const orderEntity = createMockOrderEntity(overrides);
    return {
      ...orderEntity,
      pricingMode: orderEntity.pricingMode as PricingMode,
      approvalMethod: orderEntity.approvalMethod as ApprovalMethod | null,
      disputeStatus: orderEntity.disputeStatus as DisputeStatus,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrderRepository = createMockOrderRepository();
    mockProRepository = createMockProRepository();
    mockProProfileCategoryRepository = createMockProProfileCategoryRepository();
    mockClientProfileService = createMockClientProfileService();
    mockOrderService = createMockOrderService();
    mockCategoryRepository = createMockCategoryRepository();
    mockSubcategoryService = createMockSubcategoryService();

    service = new OrderCreationService(
      mockOrderRepository as unknown as OrderRepository,
      mockProRepository as unknown as ProRepository,
      mockProProfileCategoryRepository as unknown as ProProfileCategoryRepository,
      mockClientProfileService as unknown as ClientProfileService,
      mockOrderService as unknown as OrderService,
      mockCategoryRepository as unknown as CategoryRepository,
      mockSubcategoryService as unknown as SubcategoryService
    );
  });

  describe("createOrderRequest", () => {
    const createValidInput = (): OrderCreateInput => ({
      proProfileId: "pro-1",
      categoryId: "cat-plumbing",
      addressText: "123 Main St",
      scheduledWindowStartAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      estimatedHours: 2,
    });

    it("should create order request successfully", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 10000 }); // 100 UYU/hour in minor units
      const orderEntity = createMockOrderEntity();
      const order = createMockOrder();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      const result = await service.createOrderRequest(actor, input);

      expect(result).toBeDefined();
      expect(result.id).toBe("order-1");
      expect(result.status).toBe(OrderStatus.PENDING_PRO_CONFIRMATION);
      expect(
        mockClientProfileService.ensureClientProfileExists
      ).toHaveBeenCalledWith(actor.id);
      expect(mockProRepository.findById).toHaveBeenCalledWith("pro-1");
      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientUserId: actor.id,
          proProfileId: "pro-1",
          hourlyRateSnapshotAmount: 10000, // 100 UYU/hour in minor units (cents)
        })
      );
    });

    it("should set isFirstOrder to true for first order", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile();
      const orderEntity = createMockOrderEntity({ isFirstOrder: true });
      const order = createMockOrder({ isFirstOrder: true });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      const result = await service.createOrderRequest(actor, input);

      expect(result.isFirstOrder).toBe(true);
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isFirstOrder: true,
        })
      );
    });

    it("should set isFirstOrder to false for subsequent orders", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile();
      const existingOrder = createMockOrderEntity();
      const orderEntity = createMockOrderEntity({ isFirstOrder: false });
      const order = createMockOrder({ isFirstOrder: false });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([existingOrder]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      const result = await service.createOrderRequest(actor, input);

      expect(result.isFirstOrder).toBe(false);
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isFirstOrder: false,
        })
      );
    });

    it("should snapshot hourly rate from pro profile", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 15000 }); // 150 UYU/hour in minor units
      const orderEntity = createMockOrderEntity({
        hourlyRateSnapshotAmount: 150,
      });
      const order = createMockOrder();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      await service.createOrderRequest(actor, input);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hourlyRateSnapshotAmount: 15000, // 150 UYU/hour in minor units (cents)
        })
      );
    });

    it("should throw error if scheduled window start is in the past", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      input.scheduledWindowStartAt = new Date(Date.now() - 1000); // Past

      await expect(service.createOrderRequest(actor, input)).rejects.toThrow(
        "Scheduled window start must be in the future"
      );
    });

    it("should throw error if pro not found", async () => {
      const actor = createMockActor();
      const input = createValidInput();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(null);

      await expect(service.createOrderRequest(actor, input)).rejects.toThrow(
        "Pro not found"
      );
    });

    it("should throw error if pro is suspended", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile({ status: "suspended" });

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);

      await expect(service.createOrderRequest(actor, input)).rejects.toThrow(
        "Pro is suspended"
      );
    });

    it("should throw error if proProfileId is not provided", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (input as any).proProfileId;

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );

      await expect(service.createOrderRequest(actor, input)).rejects.toThrow(
        "Pro profile ID is required"
      );
    });

    it("should ensure client profile exists before creating order", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile();
      const orderEntity = createMockOrderEntity();
      const order = createMockOrder();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      await service.createOrderRequest(actor, input);

      expect(
        mockClientProfileService.ensureClientProfileExists
      ).toHaveBeenCalledWith(actor.id);
    });

    it("should create fixed-price order when category has pricingMode fixed", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      input.estimatedHours = 0;
      const proProfile = createMockProProfile();
      const orderEntity = createMockOrderEntity({
        pricingMode: "fixed",
        estimatedHours: null,
        hourlyRateSnapshotAmount: 0,
      });
      const order = createMockOrder();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        pricingMode: "fixed",
        paymentStrategy: "single_capture",
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      const result = await service.createOrderRequest(actor, input);

      expect(result).toBeDefined();
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pricingMode: "fixed",
          estimatedHours: 0,
          hourlyRateSnapshotAmount: 0,
        })
      );
    });

    it("should use ProProfileCategory hourlyRateCents when present for hourly order", async () => {
      const actor = createMockActor();
      const input = createValidInput();
      const proProfile = createMockProProfile({ hourlyRate: 10000 });
      const orderEntity = createMockOrderEntity({
        hourlyRateSnapshotAmount: 25000, // 250 UYU from junction
      });
      const order = createMockOrder();

      mockClientProfileService.ensureClientProfileExists.mockResolvedValue(
        undefined
      );
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockCategoryRepository.findById.mockResolvedValue({
        id: "cat-plumbing",
        key: "PLUMBING",
        name: "Plomería",
        slug: "plomeria",
        iconName: null,
        description: null,
        sortOrder: 0,
        pricingMode: "hourly",
        paymentStrategy: "single_capture",
        isActive: true,
        deletedAt: null,
        configJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockProProfileCategoryRepository.findByProProfileAndCategory.mockResolvedValue(
        {
          id: "rel-1",
          proProfileId: "pro-1",
          categoryId: "cat-plumbing",
          hourlyRateCents: 25000,
          startingFromCents: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
      mockOrderRepository.findByClientUserId.mockResolvedValue([]);
      mockOrderRepository.create.mockResolvedValue(orderEntity);
      mockOrderService.getOrderById.mockResolvedValue(order);

      await service.createOrderRequest(actor, input);

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hourlyRateSnapshotAmount: 25000,
          pricingMode: "hourly",
        })
      );
    });
  });
});

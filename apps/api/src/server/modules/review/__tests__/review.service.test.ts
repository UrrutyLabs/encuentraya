import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewService } from "../review.service";
import type { ReviewRepository } from "../review.repo";
import type { OrderRepository, OrderEntity } from "@modules/order/order.repo";
import type { ProRepository, ProProfileEntity } from "@modules/pro/pro.repo";
import type { ProService } from "@modules/pro/pro.service";
import type { AvatarUrlService } from "@modules/avatar/avatar-url.service";
import type { ReviewCreateInput } from "@repo/domain";
import { OrderStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { OrderNotFoundError } from "@modules/order/order.errors";
import {
  OrderNotCompletedError,
  ReviewAlreadyExistsError,
  UnauthorizedReviewError,
} from "../review.errors";

describe("ReviewService", () => {
  let service: ReviewService;
  let mockReviewRepository: ReturnType<typeof createMockReviewRepository>;
  let mockOrderRepository: ReturnType<typeof createMockOrderRepository>;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockProService: ReturnType<typeof createMockProService>;
  let mockAvatarUrlService: ReturnType<typeof createMockAvatarUrlService>;

  function createMockAvatarUrlService(): {
    resolveClientAvatar: ReturnType<typeof vi.fn>;
  } {
    return {
      resolveClientAvatar: vi.fn().mockResolvedValue(undefined),
    };
  }

  function createMockReviewRepository(): {
    create: ReturnType<typeof vi.fn>;
    findByOrderId: ReturnType<typeof vi.fn>;
    findByOrderIds: ReturnType<typeof vi.fn>;
    listForPro: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findByOrderId: vi.fn(),
      findByOrderIds: vi.fn(),
      listForPro: vi.fn(),
    };
  }

  function createMockOrderRepository(): {
    findById: ReturnType<typeof vi.fn>;
  } {
    return {
      findById: vi.fn(),
    };
  }

  function createMockProService(): {
    onReviewCreated: ReturnType<typeof vi.fn>;
  } {
    return {
      onReviewCreated: vi.fn(),
    };
  }

  function createMockProRepository(): {
    findByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByUserId: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
    return { id, role };
  }

  function createMockOrder(overrides?: Partial<OrderEntity>): OrderEntity {
    return {
      id: "order-1",
      displayId: "O0001",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      categoryId: "cat-plumbing",
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
      // Ensure categoryMetadataJson is never undefined (convert to null if needed)
      categoryMetadataJson: overrides?.categoryMetadataJson ?? null,
    };
  }

  function createMockReview(
    overrides?: Partial<{
      id: string;
      orderId: string;
      rating: number;
      comment: string | null;
      proProfileId: string;
      clientUserId: string;
      createdAt: Date;
    }>
  ) {
    return {
      id: "review-1",
      orderId: "order-1",
      proProfileId: "pro-1",
      clientUserId: "client-1",
      rating: 4,
      comment: "Great service!",
      createdAt: new Date(),
      ...overrides,
    };
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
    };
    return {
      ...base,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockReviewRepository = createMockReviewRepository();
    mockOrderRepository = createMockOrderRepository();
    mockProRepository = createMockProRepository();
    mockProService = createMockProService();
    mockAvatarUrlService = createMockAvatarUrlService();
    service = new ReviewService(
      mockReviewRepository as unknown as ReviewRepository,
      mockOrderRepository as unknown as OrderRepository,
      mockProRepository as unknown as ProRepository,
      mockProService as unknown as ProService,
      mockAvatarUrlService as unknown as AvatarUrlService
    );
  });

  describe("createReview", () => {
    it("should create review for completed order", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
        comment: "Great service!",
      };
      const order = createMockOrder({
        id: input.orderId,
        clientUserId: actor.id,
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const review = createMockReview({
        orderId: input.orderId,
        rating: input.rating,
        comment: input.comment,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(review);
      vi.mocked(mockProService.onReviewCreated).mockResolvedValue(undefined);

      // Act
      const result = await service.createReview(actor, input);

      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(input.orderId);
      expect(mockReviewRepository.findByOrderId).toHaveBeenCalledWith(
        input.orderId
      );
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        orderId: input.orderId,
        proProfileId: order.proProfileId,
        clientUserId: order.clientUserId,
        rating: input.rating,
        comment: input.comment,
      });
      expect(result).toMatchObject({
        id: review.id,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: expect.any(Date),
      });
    });

    it("should throw UnauthorizedReviewError when actor is not a client", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        UnauthorizedReviewError
      );
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Only clients can create reviews"
      );
      expect(mockOrderRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw error when rating is less than 1", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 0,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
    });

    it("should throw error when rating is greater than 5", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 6,
      };

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Rating must be between 1 and 5"
      );
    });

    it("should throw OrderNotFoundError when order does not exist", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const input: ReviewCreateInput = {
        orderId: "non-existent",
        rating: 4,
      };

      mockOrderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        OrderNotFoundError
      );
    });

    it("should throw UnauthorizedReviewError when order does not belong to client", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
      };
      const order = createMockOrder({
        clientUserId: "different-client",
      });

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        UnauthorizedReviewError
      );
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Order does not belong to this client"
      );
    });

    it("should throw OrderNotCompletedError when order is not completed or paid", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
      };
      const order = createMockOrder({
        clientUserId: actor.id,
        status: OrderStatus.ACCEPTED,
      });

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        OrderNotCompletedError
      );
    });

    it("should throw error when order has no pro assigned", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
      };
      const order = createMockOrder({
        clientUserId: actor.id,
        status: OrderStatus.COMPLETED,
        proProfileId: null,
      });

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        "Order must have a pro assigned to be reviewed"
      );
    });

    it("should throw ReviewAlreadyExistsError when review already exists", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 4,
      };
      const order = createMockOrder({
        clientUserId: actor.id,
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const existingReview = createMockReview();

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(existingReview);

      // Act & Assert
      await expect(service.createReview(actor, input)).rejects.toThrow(
        ReviewAlreadyExistsError
      );
      expect(mockReviewRepository.create).not.toHaveBeenCalled();
    });

    it("should create review without comment when comment is not provided", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const input: ReviewCreateInput = {
        orderId: "order-1",
        rating: 5,
        // No comment
      };
      const order = createMockOrder({
        clientUserId: actor.id,
        status: OrderStatus.COMPLETED,
        proProfileId: "pro-1",
      });
      const review = createMockReview({
        rating: 5,
        comment: null,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(null);
      mockReviewRepository.create.mockResolvedValue(review);
      vi.mocked(mockProService.onReviewCreated).mockResolvedValue(undefined);

      // Act
      const result = await service.createReview(actor, input);

      // Assert
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: undefined,
        })
      );
      expect(result.comment).toBeNull();
    });
  });

  describe("getByOrderId", () => {
    it("should return review when client views their own order review", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const orderId = "order-1";
      const order = createMockOrder({
        id: orderId,
        clientUserId: actor.id,
      });
      const review = createMockReview({ orderId });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(review);

      // Act
      const result = await service.getByOrderId(actor, orderId);

      // Assert
      expect(result).toMatchObject({
        id: review.id,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: expect.any(Date),
      });
    });

    it("should return null when review does not exist yet", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const orderId = "order-1";
      const order = createMockOrder({
        id: orderId,
        clientUserId: actor.id,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(null);

      // Act
      const result = await service.getByOrderId(actor, orderId);

      // Assert
      expect(result).toBeNull();
    });

    it("should allow admin to view any review", async () => {
      // Arrange
      const actor = createMockActor(Role.ADMIN, "admin-1");
      const orderId = "order-1";
      const order = createMockOrder({ id: orderId });
      const review = createMockReview({ orderId });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockReviewRepository.findByOrderId.mockResolvedValue(review);

      // Act
      const result = await service.getByOrderId(actor, orderId);

      // Assert
      expect(result).not.toBeNull();
      expect(mockProRepository.findByUserId).not.toHaveBeenCalled();
    });

    it("should allow pro to view review for their assigned order", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const orderId = "order-1";
      const order = createMockOrder({
        id: orderId,
        proProfileId: "pro-1",
      });
      const review = createMockReview({ orderId });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: actor.id,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockReviewRepository.findByOrderId.mockResolvedValue(review);

      // Act
      const result = await service.getByOrderId(actor, orderId);

      // Assert
      expect(result).not.toBeNull();
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(actor.id);
    });

    it("should throw UnauthorizedReviewError when client tries to view another client's review", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT, "client-1");
      const orderId = "order-1";
      const order = createMockOrder({
        id: orderId,
        clientUserId: "different-client",
      });

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act & Assert
      await expect(service.getByOrderId(actor, orderId)).rejects.toThrow(
        UnauthorizedReviewError
      );
    });

    it("should throw UnauthorizedReviewError when pro tries to view review for unassigned order", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-1");
      const orderId = "order-1";
      const order = createMockOrder({
        id: orderId,
        proProfileId: "different-pro",
      });
      const proProfile = createMockProProfile({
        id: "pro-1",
        userId: actor.id,
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockProRepository.findByUserId.mockResolvedValue(proProfile);

      // Act & Assert
      await expect(service.getByOrderId(actor, orderId)).rejects.toThrow(
        UnauthorizedReviewError
      );
    });

    it("should throw OrderNotFoundError when order does not exist", async () => {
      // Arrange
      const actor = createMockActor(Role.CLIENT);
      const orderId = "non-existent";

      mockOrderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getByOrderId(actor, orderId)).rejects.toThrow(
        OrderNotFoundError
      );
    });
  });

  describe("listForPro", () => {
    it("should return reviews for a pro with client display names", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        {
          ...createMockReview({
            id: "review-1",
            rating: 5,
            clientUserId: "client-1",
          }),
          clientDisplayName: "Juan P.",
        },
        {
          ...createMockReview({
            id: "review-2",
            rating: 4,
            clientUserId: "client-2",
          }),
          clientDisplayName: "María G.",
        },
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(mockReviewRepository.listForPro).toHaveBeenCalledWith(
        proProfileId,
        undefined,
        undefined
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "review-1",
        orderId: "order-1",
        rating: 5,
        createdAt: expect.any(Date),
        clientDisplayName: "Juan P.",
      });
      expect(result[1]).toMatchObject({
        id: "review-2",
        orderId: "order-1",
        rating: 4,
        createdAt: expect.any(Date),
        clientDisplayName: "María G.",
      });
    });

    it("should handle missing lastName in client profile", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        {
          ...createMockReview({
            id: "review-1",
            rating: 5,
            clientUserId: "client-1",
          }),
          clientDisplayName: "Juan",
        },
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(result[0]).toMatchObject({
        clientDisplayName: "Juan",
      });
    });

    it("should handle missing firstName in client profile", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        {
          ...createMockReview({
            id: "review-1",
            rating: 5,
            clientUserId: "client-1",
          }),
          clientDisplayName: "Cliente",
        },
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(result[0]).toMatchObject({
        clientDisplayName: "Cliente",
      });
    });

    it("should handle missing client profile", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        {
          ...createMockReview({
            id: "review-1",
            rating: 5,
            clientUserId: "client-1",
          }),
          clientDisplayName: "Cliente",
        },
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(result[0]).toMatchObject({
        clientDisplayName: "Cliente",
      });
    });

    it("should pass limit and cursor to repository", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const limit = 10;
      const cursor = "cursor-123";

      mockReviewRepository.listForPro.mockResolvedValue([]);

      // Act
      await service.listForPro(proProfileId, limit, cursor);

      // Assert
      expect(mockReviewRepository.listForPro).toHaveBeenCalledWith(
        proProfileId,
        limit,
        cursor
      );
    });

    it("should return empty array when pro has no reviews", async () => {
      // Arrange
      const proProfileId = "pro-1";

      mockReviewRepository.listForPro.mockResolvedValue([]);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should return client display names from repository join", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reviews = [
        {
          ...createMockReview({
            id: "review-1",
            rating: 5,
            clientUserId: "client-1",
          }),
          clientDisplayName: "Juan P.",
        },
        {
          ...createMockReview({
            id: "review-2",
            rating: 4,
            clientUserId: "client-1", // Same client
          }),
          clientDisplayName: "Juan P.",
        },
      ];

      mockReviewRepository.listForPro.mockResolvedValue(reviews);

      // Act
      const result = await service.listForPro(proProfileId);

      // Assert
      // Repository handles the join and formatting, service just passes through
      expect(result[0].clientDisplayName).toBe("Juan P.");
      expect(result[1].clientDisplayName).toBe("Juan P.");
    });
  });

  describe("getReviewStatusByOrderIds", () => {
    it("should return status map for multiple orders", async () => {
      // Arrange
      const orderIds = ["order-1", "order-2", "order-3"];
      const reviews = [
        createMockReview({ orderId: "order-1" }),
        createMockReview({ orderId: "order-3" }),
      ];

      mockReviewRepository.findByOrderIds.mockResolvedValue(reviews);

      // Act
      const result = await service.getReviewStatusByOrderIds(orderIds);

      // Assert
      expect(mockReviewRepository.findByOrderIds).toHaveBeenCalledWith(
        orderIds
      );
      expect(result).toEqual({
        "order-1": true,
        "order-2": false,
        "order-3": true,
      });
    });

    it("should return empty object when no order IDs provided", async () => {
      // Arrange
      mockReviewRepository.findByOrderIds.mockResolvedValue([]);

      // Act
      const result = await service.getReviewStatusByOrderIds([]);

      // Assert
      expect(result).toEqual({});
      expect(mockReviewRepository.findByOrderIds).not.toHaveBeenCalled();
    });

    it("should return all false when no reviews exist", async () => {
      // Arrange
      const orderIds = ["order-1", "order-2"];

      mockReviewRepository.findByOrderIds.mockResolvedValue([]);

      // Act
      const result = await service.getReviewStatusByOrderIds(orderIds);

      // Assert
      expect(result).toEqual({
        "order-1": false,
        "order-2": false,
      });
    });
  });
});

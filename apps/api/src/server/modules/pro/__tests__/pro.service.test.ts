import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProService } from "../pro.service";
import type { ProRepository, ProProfileEntity } from "../pro.repo";
import type { ReviewRepository } from "@modules/review/review.repo";
import type { UserRepository, UserEntity } from "@modules/user/user.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { ProPayoutProfileRepository, ProPayoutProfileEntity } from "@modules/payout/proPayoutProfile.repo";
import type { AuditService } from "@modules/audit/audit.service";
import type { AvailabilityRepository } from "../availability.repo";
import { AuditEventType } from "@modules/audit/audit.repo";
import type { ProOnboardInput, ProSetAvailabilityInput, Category } from "@repo/domain";
import { Role, BookingStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";

describe("ProService", () => {
  let service: ProService;
  let mockProRepository: ReturnType<typeof createMockProRepository>;
  let mockReviewRepository: ReturnType<typeof createMockReviewRepository>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockBookingRepository: ReturnType<typeof createMockBookingRepository>;
  let mockProPayoutProfileRepository: ReturnType<typeof createMockProPayoutProfileRepository>;
  let mockAvailabilityRepository: ReturnType<typeof createMockAvailabilityRepository>;
  let mockAuditService: ReturnType<typeof createMockAuditService>;

  function createMockProRepository(): {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByUserId: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findAllWithFilters: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      findAllWithFilters: vi.fn(),
      updateStatus: vi.fn(),
      update: vi.fn(),
    };
  }

  function createMockReviewRepository(): {
    findByProProfileId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileId: vi.fn(),
    };
  }

  function createMockUserRepository(): {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
  } {
    return {
      create: vi.fn(),
      findById: vi.fn(),
      updateRole: vi.fn(),
    };
  }

  function createMockBookingRepository(): {
    findByProProfileId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileId: vi.fn(),
    };
  }

  function createMockProPayoutProfileRepository(): {
    findByProProfileId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileId: vi.fn(),
    };
  }

  function createMockAvailabilityRepository(): {
    findByProProfileId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    deleteByProProfileId: ReturnType<typeof vi.fn>;
  } {
    return {
      findByProProfileId: vi.fn(),
      create: vi.fn(),
      deleteByProProfileId: vi.fn(),
    };
  }

  function createMockAuditService(): {
    logEvent: ReturnType<typeof vi.fn>;
  } {
    return {
      logEvent: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.ADMIN, id = "admin-1"): Actor {
    return { id, role };
  }

  function createMockUser(overrides?: Partial<UserEntity>): UserEntity {
    return {
      id: "user-1",
      role: Role.PRO,
      deletedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  function createMockProProfile(overrides?: Partial<ProProfileEntity>): ProProfileEntity {
    return {
      id: "pro-1",
      userId: "user-1",
      displayName: "Test Pro",
      email: "pro@example.com",
      phone: "+1234567890",
      bio: "Test bio",
      hourlyRate: 100,
      categories: ["plumbing"],
      serviceArea: "Test Area",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockReview(overrides?: Partial<{
    id: string;
    rating: number;
  }>) {
    return {
      id: "review-1",
      bookingId: "booking-1",
      proProfileId: "pro-1",
      clientUserId: "client-1",
      rating: 4,
      comment: "Great service!",
      createdAt: new Date(),
      ...overrides,
    };
  }

  function createMockBooking(overrides?: Partial<{
    id: string;
    status: BookingStatus;
  }>) {
    return {
      id: "booking-1",
      clientUserId: "client-1",
      proProfileId: "pro-1",
      category: "PLUMBING",
      status: BookingStatus.COMPLETED,
      scheduledAt: new Date(),
      hoursEstimate: 2,
      addressText: "123 Main St",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function createMockProPayoutProfile(overrides?: Partial<ProPayoutProfileEntity>): ProPayoutProfileEntity {
    return {
      id: "payout-profile-1",
      proProfileId: "pro-1",
      payoutMethod: "BANK_TRANSFER",
      fullName: "John Doe",
      documentId: "12345678",
      bankName: "Test Bank",
      bankAccountType: "CHECKING",
      bankAccountNumber: "123456789",
      currency: "USD",
      isComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockProRepository = createMockProRepository();
    mockReviewRepository = createMockReviewRepository();
    mockUserRepository = createMockUserRepository();
    mockBookingRepository = createMockBookingRepository();
    mockProPayoutProfileRepository = createMockProPayoutProfileRepository();
    mockAvailabilityRepository = createMockAvailabilityRepository();
    mockAuditService = createMockAuditService();
    
    // Set default return values for availability repository
    mockAvailabilityRepository.findByProProfileId.mockResolvedValue([]);
    
    service = new ProService(
      mockProRepository as unknown as ProRepository,
      mockReviewRepository as unknown as ReviewRepository,
      mockUserRepository as unknown as UserRepository,
      mockBookingRepository as unknown as BookingRepository,
      mockProPayoutProfileRepository as unknown as ProPayoutProfileRepository,
      mockAvailabilityRepository as unknown as AvailabilityRepository,
      mockAuditService as unknown as AuditService
    );
    vi.clearAllMocks();
    
    // Re-set default after clearAllMocks
    mockAvailabilityRepository.findByProProfileId.mockResolvedValue([]);
  });

  describe("onboardPro", () => {
    it("should create user and pro profile", async () => {
      // Arrange
      const input: ProOnboardInput = {
        name: "Test Pro",
        email: "pro@example.com",
        phone: "+1234567890",
        hourlyRate: 100,
        categories: ["plumbing" as Category],
        serviceArea: "Test Area",
      };
      const user = createMockUser();
      const proProfile = createMockProProfile({
        userId: user.id,
        displayName: input.name,
        email: input.email,
        phone: input.phone,
        hourlyRate: input.hourlyRate,
        categories: input.categories as string[],
        serviceArea: input.serviceArea,
      });

      mockUserRepository.create.mockResolvedValue(user);
      mockProRepository.create.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.onboardPro(input);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(Role.PRO);
      expect(mockProRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        displayName: input.name,
        email: input.email,
        phone: input.phone,
        bio: undefined,
        hourlyRate: input.hourlyRate,
        categories: input.categories as string[],
        serviceArea: input.serviceArea,
      });
      expect(result).toMatchObject({
        id: proProfile.id,
        name: proProfile.displayName,
        email: proProfile.email,
        phone: proProfile.phone ?? undefined,
        hourlyRate: proProfile.hourlyRate,
        categories: input.categories,
        serviceArea: proProfile.serviceArea ?? undefined,
        rating: undefined,
        reviewCount: 0,
        isApproved: true,
        isSuspended: false,
      });
    });
  });

  describe("convertUserToPro", () => {
    it("should return existing pro profile if already exists", async () => {
      // Arrange
      const userId = "user-1";
      const input: ProOnboardInput = {
        name: "Test Pro",
        email: "pro@example.com",
        phone: "+1234567890",
        hourlyRate: 100,
        categories: ["plumbing" as Category],
        serviceArea: "Test Area",
      };
      const existingPro = createMockProProfile({ userId });

      mockProRepository.findByUserId.mockResolvedValue(existingPro);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.convertUserToPro(userId, input);

      // Assert
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockProRepository.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: existingPro.id,
        name: existingPro.displayName,
      });
    });

    it("should create pro profile for existing user", async () => {
      // Arrange
      const userId = "user-1";
      const input: ProOnboardInput = {
        name: "Test Pro",
        email: "pro@example.com",
        phone: "+1234567890",
        hourlyRate: 100,
        categories: ["plumbing" as Category],
        serviceArea: "Test Area",
      };
      const user = createMockUser({ id: userId, role: Role.PRO });
      const proProfile = createMockProProfile({ userId });

      mockProRepository.findByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(user);
      mockProRepository.create.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.convertUserToPro(userId, input);

      // Assert
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateRole).not.toHaveBeenCalled();
      expect(mockProRepository.create).toHaveBeenCalledWith({
        userId,
        displayName: input.name,
        email: input.email,
        phone: input.phone,
        bio: undefined,
        hourlyRate: input.hourlyRate,
        categories: input.categories as string[],
        serviceArea: input.serviceArea,
      });
      expect(result).toMatchObject({
        id: proProfile.id,
        name: proProfile.displayName,
      });
    });

    it("should update user role to PRO if not already PRO", async () => {
      // Arrange
      const userId = "user-1";
      const input: ProOnboardInput = {
        name: "Test Pro",
        email: "pro@example.com",
        phone: "+1234567890",
        hourlyRate: 100,
        categories: ["plumbing" as Category],
        serviceArea: "Test Area",
      };
      const user = createMockUser({ id: userId, role: Role.CLIENT });
      const updatedUser = createMockUser({ id: userId, role: Role.PRO });
      const proProfile = createMockProProfile({ userId });

      mockProRepository.findByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.updateRole.mockResolvedValue(updatedUser);
      mockProRepository.create.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.convertUserToPro(userId, input);

      // Assert
      expect(mockUserRepository.updateRole).toHaveBeenCalledWith(userId, Role.PRO);
      expect(result).toMatchObject({
        id: proProfile.id,
      });
    });

    it("should throw error when user not found", async () => {
      // Arrange
      const userId = "non-existent";
      const input: ProOnboardInput = {
        name: "Test Pro",
        email: "pro@example.com",
        phone: "+1234567890",
        hourlyRate: 100,
        categories: ["plumbing" as Category],
        serviceArea: "Test Area",
      };

      mockProRepository.findByUserId.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.convertUserToPro(userId, input)).rejects.toThrow("User not found");
      expect(mockProRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getProById", () => {
    it("should return pro when found", async () => {
      // Arrange
      const proId = "pro-1";
      const proProfile = createMockProProfile({ id: proId });
      const reviews = [
        createMockReview({ rating: 4 }),
        createMockReview({ rating: 5 }),
      ];

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue(reviews);

      // Act
      const result = await service.getProById(proId);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proId);
      expect(result).toMatchObject({
        id: proProfile.id,
        name: proProfile.displayName,
        rating: 4.5,
        reviewCount: 2,
      });
    });

    it("should return null when pro not found", async () => {
      // Arrange
      const proId = "non-existent";
      mockProRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getProById(proId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getAllPros", () => {
    it("should return all pros with ratings", async () => {
      // Arrange
      const proProfiles = [
        createMockProProfile({ id: "pro-1" }),
        createMockProProfile({ id: "pro-2" }),
      ];
      const reviews1 = [createMockReview({ rating: 4 })];
      const reviews2 = [createMockReview({ rating: 5 })];

      mockProRepository.findAll.mockResolvedValue(proProfiles);
      mockReviewRepository.findByProProfileId
        .mockResolvedValueOnce(reviews1)
        .mockResolvedValueOnce(reviews2);

      // Act
      const result = await service.getAllPros();

      // Assert
      expect(mockProRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "pro-1",
        rating: 4,
        reviewCount: 1,
      });
      expect(result[1]).toMatchObject({
        id: "pro-2",
        rating: 5,
        reviewCount: 1,
      });
    });
  });

  describe("getProByUserId", () => {
    it("should return pro when found", async () => {
      // Arrange
      const userId = "user-1";
      const proProfile = createMockProProfile({ userId });
      mockProRepository.findByUserId.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.getProByUserId(userId);

      // Assert
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toMatchObject({
        id: proProfile.id,
        name: proProfile.displayName,
      });
    });

    it("should return null when pro not found", async () => {
      // Arrange
      const userId = "non-existent";
      mockProRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await service.getProByUserId(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("setAvailability", () => {
    it("should return pro when found", async () => {
      // Arrange
      const proId = "pro-1";
      const input: ProSetAvailabilityInput = {
        isAvailable: true,
      };
      const proProfile = createMockProProfile({ id: proId });
      mockProRepository.findById.mockResolvedValue(proProfile);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.setAvailability(proId, input);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proId);
      expect(result).toMatchObject({
        id: proProfile.id,
      });
    });

    it("should throw error when pro not found", async () => {
      // Arrange
      const proId = "non-existent";
      const input: ProSetAvailabilityInput = {
        isAvailable: true,
      };
      mockProRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.setAvailability(proId, input)).rejects.toThrow("Pro not found");
    });
  });

  describe("updateProfile", () => {
    it("should update pro profile with provided fields", async () => {
      // Arrange
      const userId = "user-1";
      const input: Partial<ProOnboardInput> = {
        name: "Updated Name",
        hourlyRate: 150,
      };
      const existingPro = createMockProProfile({ userId });
      const updatedPro = createMockProProfile({
        ...existingPro,
        displayName: input.name!,
        hourlyRate: input.hourlyRate!,
      });

      mockProRepository.findByUserId.mockResolvedValue(existingPro);
      mockProRepository.update.mockResolvedValue(updatedPro);
      mockReviewRepository.findByProProfileId.mockResolvedValue([]);

      // Act
      const result = await service.updateProfile(userId, input);

      // Assert
      expect(mockProRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockProRepository.update).toHaveBeenCalledWith(existingPro.id, {
        displayName: input.name,
        hourlyRate: input.hourlyRate,
      });
      expect(result).toMatchObject({
        id: updatedPro.id,
        name: updatedPro.displayName,
        hourlyRate: updatedPro.hourlyRate,
      });
    });

    it("should throw error when pro profile not found", async () => {
      // Arrange
      const userId = "non-existent";
      const input: Partial<ProOnboardInput> = {
        name: "Updated Name",
      };
      mockProRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateProfile(userId, input)).rejects.toThrow("Pro profile not found");
    });
  });

  describe("adminListPros", () => {
    it("should return pros with stats", async () => {
      // Arrange
      const proProfiles = [
        createMockProProfile({ id: "pro-1", status: "active" }),
        createMockProProfile({ id: "pro-2", status: "pending" }),
      ];
      const bookings1 = [
        createMockBooking({ status: BookingStatus.COMPLETED }),
        createMockBooking({ status: BookingStatus.COMPLETED }),
        createMockBooking({ status: BookingStatus.PENDING }),
      ];
      const bookings2: ReturnType<typeof createMockBooking>[] = [];
      const payoutProfile1 = createMockProPayoutProfile({ proProfileId: "pro-1", isComplete: true });
      const payoutProfile2 = null;

      mockProRepository.findAllWithFilters.mockResolvedValue(proProfiles);
      mockBookingRepository.findByProProfileId
        .mockResolvedValueOnce(bookings1)
        .mockResolvedValueOnce(bookings2);
      mockProPayoutProfileRepository.findByProProfileId
        .mockResolvedValueOnce(payoutProfile1)
        .mockResolvedValueOnce(payoutProfile2);

      // Act
      const result = await service.adminListPros();

      // Assert
      expect(mockProRepository.findAllWithFilters).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "pro-1",
        displayName: proProfiles[0].displayName,
        email: proProfiles[0].email,
        status: "active",
        completedJobsCount: 2,
        isPayoutProfileComplete: true,
      });
      expect(result[1]).toMatchObject({
        id: "pro-2",
        completedJobsCount: 0,
        isPayoutProfileComplete: false,
      });
    });

    it("should pass filters to repository", async () => {
      // Arrange
      const filters = {
        query: "test",
        status: "active" as const,
        limit: 10,
      };
      mockProRepository.findAllWithFilters.mockResolvedValue([]);

      // Act
      await service.adminListPros(filters);

      // Assert
      expect(mockProRepository.findAllWithFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe("adminGetProById", () => {
    it("should return pro with payout profile", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const proProfile = createMockProProfile({ id: proProfileId });
      const payoutProfile = createMockProPayoutProfile({ proProfileId });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(payoutProfile);

      // Act
      const result = await service.adminGetProById(proProfileId);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proProfileId);
      expect(mockProPayoutProfileRepository.findByProProfileId).toHaveBeenCalledWith(proProfileId);
      expect(result).toMatchObject({
        id: proProfile.id,
        userId: proProfile.userId,
        displayName: proProfile.displayName,
        email: proProfile.email,
        payoutProfile: {
          id: payoutProfile.id,
          payoutMethod: payoutProfile.payoutMethod,
          fullName: payoutProfile.fullName,
          isComplete: payoutProfile.isComplete,
        },
      });
    });

    it("should return pro with null payout profile when not found", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const proProfile = createMockProProfile({ id: proProfileId });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProPayoutProfileRepository.findByProProfileId.mockResolvedValue(null);

      // Act
      const result = await service.adminGetProById(proProfileId);

      // Assert
      expect(result.payoutProfile).toBeNull();
    });

    it("should throw error when pro not found", async () => {
      // Arrange
      const proProfileId = "non-existent";
      mockProRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.adminGetProById(proProfileId)).rejects.toThrow(
        `Pro profile not found: ${proProfileId}`
      );
    });
  });

  describe("suspendPro", () => {
    it("should suspend pro and log audit event", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const reason = "Violation of terms";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "active" });
      const suspendedPro = createMockProProfile({ id: proProfileId, status: "suspended" });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProRepository.updateStatus.mockResolvedValue(suspendedPro);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.suspendPro(proProfileId, reason, actor);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proProfileId);
      expect(mockProRepository.updateStatus).toHaveBeenCalledWith(proProfileId, "suspended");
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PRO_SUSPENDED,
        actor,
        resourceType: "pro",
        resourceId: proProfileId,
        action: "suspend",
        metadata: {
          reason,
          previousStatus: "active",
          newStatus: "suspended",
          proDisplayName: proProfile.displayName,
          proEmail: proProfile.email,
        },
      });
      expect(result).toEqual(suspendedPro);
    });

    it("should throw error when pro not found", async () => {
      // Arrange
      const proProfileId = "non-existent";
      const actor = createMockActor(Role.ADMIN);
      mockProRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.suspendPro(proProfileId, undefined, actor)).rejects.toThrow(
        `Pro profile not found: ${proProfileId}`
      );
    });
  });

  describe("unsuspendPro", () => {
    it("should unsuspend pro and log audit event", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "suspended" });
      const activePro = createMockProProfile({ id: proProfileId, status: "active" });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProRepository.updateStatus.mockResolvedValue(activePro);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.unsuspendPro(proProfileId, actor);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proProfileId);
      expect(mockProRepository.updateStatus).toHaveBeenCalledWith(proProfileId, "active");
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PRO_UNSUSPENDED,
        actor,
        resourceType: "pro",
        resourceId: proProfileId,
        action: "unsuspend",
        metadata: {
          previousStatus: "suspended",
          newStatus: "active",
          proDisplayName: proProfile.displayName,
          proEmail: proProfile.email,
        },
      });
      expect(result).toEqual(activePro);
    });

    it("should throw error when pro not found", async () => {
      // Arrange
      const proProfileId = "non-existent";
      const actor = createMockActor(Role.ADMIN);
      mockProRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.unsuspendPro(proProfileId, actor)).rejects.toThrow(
        `Pro profile not found: ${proProfileId}`
      );
    });
  });

  describe("approvePro", () => {
    it("should approve pro and log audit event", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "pending" });
      const activePro = createMockProProfile({ id: proProfileId, status: "active" });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProRepository.updateStatus.mockResolvedValue(activePro);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.approvePro(proProfileId, actor);

      // Assert
      expect(mockProRepository.findById).toHaveBeenCalledWith(proProfileId);
      expect(mockProRepository.updateStatus).toHaveBeenCalledWith(proProfileId, "active");
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PRO_APPROVED,
        actor,
        resourceType: "pro",
        resourceId: proProfileId,
        action: "approve",
        metadata: {
          previousStatus: "pending",
          newStatus: "active",
          proDisplayName: proProfile.displayName,
          proEmail: proProfile.email,
        },
      });
      expect(result).toEqual(activePro);
    });

    it("should throw error when pro not found", async () => {
      // Arrange
      const proProfileId = "non-existent";
      const actor = createMockActor(Role.ADMIN);
      mockProRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approvePro(proProfileId, actor)).rejects.toThrow(
        `Pro profile not found: ${proProfileId}`
      );
    });

    it("should throw error when pro is not pending", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "active" });

      mockProRepository.findById.mockResolvedValue(proProfile);

      // Act & Assert
      await expect(service.approvePro(proProfileId, actor)).rejects.toThrow(
        `Pro profile is not pending. Current status: active`
      );
      expect(mockProRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it("should throw error when pro is suspended", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "suspended" });

      mockProRepository.findById.mockResolvedValue(proProfile);

      // Act & Assert
      await expect(service.approvePro(proProfileId, actor)).rejects.toThrow(
        `Pro profile is not pending. Current status: suspended`
      );
      expect(mockProRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });

    it("should throw error when updateStatus fails", async () => {
      // Arrange
      const proProfileId = "pro-1";
      const actor = createMockActor(Role.ADMIN);
      const proProfile = createMockProProfile({ id: proProfileId, status: "pending" });

      mockProRepository.findById.mockResolvedValue(proProfile);
      mockProRepository.updateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approvePro(proProfileId, actor)).rejects.toThrow(
        `Failed to approve pro: ${proProfileId}`
      );
      expect(mockAuditService.logEvent).not.toHaveBeenCalled();
    });
  });
});

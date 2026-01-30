import { injectable, inject } from "tsyringe";
import {
  type ProRepository,
  type ProProfileEntity,
  type ProProfileUpdateInput,
} from "./pro.repo";
import type { ReviewRepository } from "@modules/review/review.repo";
import type { UserRepository } from "@modules/user/user.repo";
import type { OrderRepository } from "@modules/order/order.repo";
import type { ProPayoutProfileRepository } from "@modules/payout/proPayoutProfile.repo";
import type { AuditService } from "@modules/audit/audit.service";
import type { AvailabilityRepository } from "./availability.repo";
import type { AvailabilityService } from "./availability.service";
import { AuditEventType } from "@modules/audit/audit.repo";
import type {
  Pro,
  ProOnboardInput,
  ProSetAvailabilityInput,
  AvailabilitySlot,
  UpdateAvailabilitySlotsInput,
} from "@repo/domain";
import { Role } from "@repo/domain";
import { TOKENS } from "@/server/container/tokens";
import type { Actor } from "@infra/auth/roles";
import { calculateIsTopPro } from "./pro.calculations";

/**
 * Pro service
 * Contains business logic for pro operations
 * Note: Temporarily adapts between new repository entities and domain types for router compatibility
 */
@injectable()
export class ProService {
  constructor(
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProPayoutProfileRepository)
    private readonly proPayoutProfileRepository: ProPayoutProfileRepository,
    @inject(TOKENS.AvailabilityRepository)
    private readonly availabilityRepository: AvailabilityRepository,
    @inject(TOKENS.AvailabilityService)
    private readonly availabilityService: AvailabilityService,
    @inject(TOKENS.AuditService)
    private readonly auditService: AuditService
  ) {}
  /**
   * Onboard a new pro
   * Business rules:
   * - User must be created first
   */
  async onboardPro(input: ProOnboardInput): Promise<Pro> {
    // Create user first
    const user = await this.userRepository.create(Role.PRO);

    // Create pro profile
    const proProfile = await this.proRepository.create({
      userId: user.id,
      displayName: input.name,
      email: input.email,
      phone: input.phone,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      hourlyRate: input.hourlyRate,
      categoryIds: input.categoryIds,
      serviceArea: input.serviceArea,
    });

    // Map to domain type
    return this.mapToDomain(proProfile);
  }

  /**
   * Convert an existing user to PRO role and create their pro profile
   * Used when a user signs up via pro_mobile app
   *
   * Note: With user metadata approach, users from pro_mobile are created with PRO role
   * in the context. This method serves as a safety check and ensures pro profile is created.
   *
   * Business rules:
   * - User must exist (created by context on first API call)
   * - User must not already have a pro profile
   * - User role will be updated to PRO if not already PRO (safety check)
   */
  async convertUserToPro(userId: string, input: ProOnboardInput): Promise<Pro> {
    // Check if user already has a pro profile
    const existingPro = await this.proRepository.findByUserId(userId);
    if (existingPro) {
      // If pro profile exists, return it
      return this.mapToDomain(existingPro);
    }

    // Get user to check current role
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user role to PRO if not already PRO
    if (user.role !== Role.PRO) {
      await this.userRepository.updateRole(userId, Role.PRO);
    }

    // Create pro profile
    const proProfile = await this.proRepository.create({
      userId,
      displayName: input.name,
      email: input.email,
      phone: input.phone,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      hourlyRate: input.hourlyRate,
      categoryIds: input.categoryIds,
      serviceArea: input.serviceArea,
    });

    // Map to domain type
    return this.mapToDomain(proProfile);
  }

  /**
   * Get pro by ID (for public access)
   * Only returns pros with completed profiles (avatarUrl + bio)
   */
  async getProById(id: string): Promise<Pro | null> {
    const proProfile = await this.proRepository.findById(id);
    if (!proProfile) return null;
    if (!proProfile.profileCompleted) return null;
    return this.mapToDomain(proProfile);
  }

  /**
   * Get all pros
   */
  async getAllPros(): Promise<Pro[]> {
    const proProfiles = await this.proRepository.findAll();
    return Promise.all(proProfiles.map((profile) => this.mapToDomain(profile)));
  }

  /**
   * Search pros with database filtering
   * Filters by categoryId and profileCompleted at database level
   */
  async searchPros(filters: { categoryId?: string }): Promise<Pro[]> {
    const proProfiles = await this.proRepository.searchPros({
      categoryId: filters.categoryId,
      profileCompleted: true, // Only show pros with completed profiles
    });
    return Promise.all(proProfiles.map((profile) => this.mapToDomain(profile)));
  }

  /**
   * Check if a pro is available at a specific date and time
   * Delegates to AvailabilityService
   */
  async isProAvailableAtDateTime(
    proId: string,
    date: Date,
    time: string
  ): Promise<boolean> {
    return this.availabilityService.isProAvailableAtDateTime(proId, date, time);
  }

  /**
   * Check if a pro is available on a specific day of week
   * Delegates to AvailabilityService
   */
  async isProAvailableOnDay(proId: string, date: Date): Promise<boolean> {
    return this.availabilityService.isProAvailableOnDay(proId, date);
  }

  /**
   * Check if a pro has availability slots that include a specific time
   * Delegates to AvailabilityService
   */
  async isProAvailableAtTime(proId: string, time: string): Promise<boolean> {
    return this.availabilityService.isProAvailableAtTime(proId, time);
  }

  /**
   * Get pro by user ID (for authenticated pro)
   */
  async getProByUserId(userId: string): Promise<Pro | null> {
    const proProfile = await this.proRepository.findByUserId(userId);
    if (!proProfile) return null;
    return this.mapToDomain(proProfile);
  }

  /**
   * Set pro availability
   * Business rules:
   * - Pro must exist
   * - If isAvailable is true, create default availability slots (Mon-Fri 9-17)
   * - If isAvailable is false, delete all availability slots
   */
  async setAvailability(
    proId: string,
    input: ProSetAvailabilityInput
  ): Promise<Pro> {
    const pro = await this.proRepository.findById(proId);
    if (!pro) {
      throw new Error("Pro not found");
    }

    // Update serviceArea if provided
    if (input.serviceArea !== undefined) {
      await this.proRepository.update(proId, {
        serviceArea: input.serviceArea ?? null,
      });
    }

    // Manage availability slots based on isAvailable flag
    if (input.isAvailable !== undefined) {
      if (input.isAvailable) {
        // Create default availability slots: Monday-Friday, 9:00-17:00
        await this.availabilityService.setDefaultAvailability(proId);
      } else {
        // Delete all availability slots
        await this.availabilityService.clearAvailability(proId);
      }
    }

    // Refetch the pro profile to get updated data
    const updated = await this.proRepository.findById(proId);
    if (!updated) {
      throw new Error("Failed to update pro");
    }

    return this.mapToDomain(updated);
  }

  /**
   * Get availability slots for a pro
   * Delegates to AvailabilityService
   */
  async getAvailabilitySlots(proId: string): Promise<AvailabilitySlot[]> {
    return this.availabilityService.getAvailabilitySlots(proId);
  }

  /**
   * Update availability slots for a pro
   * Business rules:
   * - Pro must exist
   * - Replaces all existing slots with new ones
   */
  async updateAvailabilitySlots(
    proId: string,
    input: UpdateAvailabilitySlotsInput
  ): Promise<AvailabilitySlot[]> {
    const pro = await this.proRepository.findById(proId);
    if (!pro) {
      throw new Error("Pro not found");
    }

    return this.availabilityService.updateAvailabilitySlots(proId, input);
  }

  /**
   * Update pro profile
   * Business rules:
   * - Pro must exist
   * - Only update provided fields
   */
  async updateProfile(
    userId: string,
    input: Partial<ProOnboardInput>
  ): Promise<Pro> {
    const proProfile = await this.proRepository.findByUserId(userId);
    if (!proProfile) {
      throw new Error("Pro profile not found");
    }

    // Map ProOnboardInput fields to ProProfileUpdateInput fields
    const updateData: Partial<ProProfileUpdateInput> = {};

    if (input.name !== undefined) {
      updateData.displayName = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }
    if (input.avatarUrl !== undefined) {
      updateData.avatarUrl = input.avatarUrl;
    }
    if (input.hourlyRate !== undefined) {
      updateData.hourlyRate = input.hourlyRate;
    }
    if (input.categoryIds !== undefined) {
      updateData.categoryIds = input.categoryIds;
    }
    if (input.serviceArea !== undefined) {
      updateData.serviceArea = input.serviceArea;
    }

    // Update pro profile
    const updated = await this.proRepository.update(proProfile.id, updateData);

    if (!updated) {
      throw new Error("Failed to update pro profile");
    }

    return this.mapToDomain(updated);
  }

  /**
   * Admin: List all pros with filters
   */
  async adminListPros(filters?: {
    query?: string;
    status?: "pending" | "active" | "suspended";
    limit?: number;
    cursor?: string;
  }): Promise<
    Array<{
      id: string;
      displayName: string;
      email: string;
      status: "pending" | "active" | "suspended";
      completedJobsCount: number;
      isPayoutProfileComplete: boolean;
      createdAt: Date;
    }>
  > {
    const proProfiles = await this.proRepository.findAllWithFilters(filters);

    // Batch fetch payout profiles for all pros
    const proProfileIds = proProfiles.map((pro) => pro.id);
    const payoutProfilesMap =
      await this.proPayoutProfileRepository.findByProProfileIds(proProfileIds);

    // Map pros to result using stored completedJobsCount and batch-fetched payout profiles
    return proProfiles.map((pro) => {
      const payoutProfile = payoutProfilesMap.get(pro.id);
      const isPayoutProfileComplete = payoutProfile?.isComplete ?? false;

      return {
        id: pro.id,
        displayName: pro.displayName,
        email: pro.email,
        status: pro.status,
        completedJobsCount: pro.completedJobsCount, // Use stored value
        isPayoutProfileComplete,
        createdAt: pro.createdAt,
      };
    });
  }

  /**
   * Admin: Get pro by ID with full details including payout profile
   */
  async adminGetProById(proProfileId: string): Promise<{
    id: string;
    userId: string;
    displayName: string;
    email: string;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    hourlyRate: number;
    categoryIds: string[];
    serviceArea: string | null;
    status: "pending" | "active" | "suspended";
    profileCompleted: boolean;
    completedJobsCount: number;
    isTopPro: boolean;
    responseTimeMinutes: number | null;
    createdAt: Date;
    updatedAt: Date;
    payoutProfile: {
      id: string;
      payoutMethod: "BANK_TRANSFER";
      fullName: string | null;
      documentId: string | null;
      bankName: string | null;
      bankAccountType: string | null;
      bankAccountNumber: string | null;
      currency: string;
      isComplete: boolean;
    } | null;
  }> {
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${proProfileId}`);
    }

    const payoutProfile =
      await this.proPayoutProfileRepository.findByProProfileId(proProfileId);

    return {
      id: proProfile.id,
      userId: proProfile.userId,
      displayName: proProfile.displayName,
      email: proProfile.email,
      phone: proProfile.phone,
      bio: proProfile.bio,
      avatarUrl: proProfile.avatarUrl,
      hourlyRate: proProfile.hourlyRate,
      categoryIds: proProfile.categoryIds,
      serviceArea: proProfile.serviceArea,
      status: proProfile.status,
      profileCompleted: proProfile.profileCompleted,
      completedJobsCount: proProfile.completedJobsCount,
      isTopPro: proProfile.isTopPro,
      responseTimeMinutes: proProfile.responseTimeMinutes,
      createdAt: proProfile.createdAt,
      updatedAt: proProfile.updatedAt,
      payoutProfile: payoutProfile
        ? {
            id: payoutProfile.id,
            payoutMethod: payoutProfile.payoutMethod,
            fullName: payoutProfile.fullName,
            documentId: payoutProfile.documentId,
            bankName: payoutProfile.bankName,
            bankAccountType: payoutProfile.bankAccountType,
            bankAccountNumber: payoutProfile.bankAccountNumber,
            currency: payoutProfile.currency,
            isComplete: payoutProfile.isComplete,
          }
        : null,
    };
  }

  /**
   * Admin: Suspend a pro
   */
  async suspendPro(
    proProfileId: string,
    reason: string | undefined,
    actor: Actor
  ): Promise<ProProfileEntity> {
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${proProfileId}`);
    }

    const previousStatus = proProfile.status;

    const updated = await this.proRepository.updateStatus(
      proProfileId,
      "suspended"
    );
    if (!updated) {
      throw new Error(`Failed to suspend pro: ${proProfileId}`);
    }

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.PRO_SUSPENDED,
      actor,
      resourceType: "pro",
      resourceId: proProfileId,
      action: "suspend",
      metadata: {
        reason: reason || null,
        previousStatus,
        newStatus: "suspended",
        proDisplayName: proProfile.displayName,
        proEmail: proProfile.email,
      },
    });

    return updated;
  }

  /**
   * Admin: Approve a pro (set status from pending to active)
   */
  async approvePro(
    proProfileId: string,
    actor: Actor
  ): Promise<ProProfileEntity> {
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${proProfileId}`);
    }

    if (proProfile.status !== "pending") {
      throw new Error(
        `Pro profile is not pending. Current status: ${proProfile.status}`
      );
    }

    const previousStatus = proProfile.status;

    const updated = await this.proRepository.updateStatus(
      proProfileId,
      "active"
    );
    if (!updated) {
      throw new Error(`Failed to approve pro: ${proProfileId}`);
    }

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.PRO_APPROVED,
      actor,
      resourceType: "pro",
      resourceId: proProfileId,
      action: "approve",
      metadata: {
        previousStatus,
        newStatus: "active",
        proDisplayName: proProfile.displayName,
        proEmail: proProfile.email,
      },
    });

    return updated;
  }

  /**
   * Admin: Unsuspend a pro (set to active)
   */
  async unsuspendPro(
    proProfileId: string,
    actor: Actor
  ): Promise<ProProfileEntity> {
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${proProfileId}`);
    }

    const previousStatus = proProfile.status;

    const updated = await this.proRepository.updateStatus(
      proProfileId,
      "active"
    );
    if (!updated) {
      throw new Error(`Failed to unsuspend pro: ${proProfileId}`);
    }

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.PRO_UNSUSPENDED,
      actor,
      resourceType: "pro",
      resourceId: proProfileId,
      action: "unsuspend",
      metadata: {
        previousStatus,
        newStatus: "active",
        proDisplayName: proProfile.displayName,
        proEmail: proProfile.email,
      },
    });

    return updated;
  }

  /**
   * Hook: Called when a review is created
   * Note: Rating is calculated dynamically from reviews, so no stored fields need updating
   * This hook is here for consistency and potential future use (e.g., caching, analytics)
   */
  async onReviewCreated(proProfileId: string): Promise<void> {
    // Currently, rating is calculated dynamically from reviews in mapToDomain()
    // No stored calculated fields need updating
    // This hook can be extended in the future if needed (e.g., to cache rating)

    // Verify pro exists (for future extensibility)
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      // Log but don't throw - review creation should succeed even if pro lookup fails
      console.warn(
        `Pro profile not found when processing review creation hook: ${proProfileId}`
      );
      return;
    }

    // Future: Could update cached rating or other calculated fields here
  }

  /**
   * Update ProProfile calculated fields after order completion
   * - Increments completedJobsCount
   * - Updates isTopPro based on completedJobsCount threshold (>= 10 jobs)
   * Note: responseTimeMinutes requires acceptedAt timestamp on order (available via acceptedAt field)
   */
  async updateCalculatedFieldsOnOrderCompletion(
    proProfileId: string
  ): Promise<void> {
    const proProfile = await this.proRepository.findById(proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${proProfileId}`);
    }

    // Count completed orders using efficient COUNT query
    const completedJobsCount =
      await this.orderRepository.countCompletedOrdersByProProfileId(
        proProfileId
      );

    // Calculate isTopPro using utility function
    const isTopPro = calculateIsTopPro(completedJobsCount);

    // Update pro profile with calculated fields
    await this.proRepository.update(proProfileId, {
      completedJobsCount,
      isTopPro,
    });
  }

  /**
   * Map ProProfileEntity to Pro domain type
   * Calculates rating and reviewCount from reviews
   * Calculates isAvailable from availability slots array
   */
  private async mapToDomain(entity: ProProfileEntity): Promise<Pro> {
    // Get reviews for this pro to calculate rating and reviewCount
    const reviews = await this.reviewRepository.findByProProfileId(entity.id);

    // Calculate average rating
    const rating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : undefined;

    // Get review count
    const reviewCount = reviews.length;

    // Map status enum to boolean flags
    const isApproved = entity.status === "active";
    const isSuspended = entity.status === "suspended";

    // Calculate isAvailable from availability slots array
    // Pro is available if they have at least one availability slot
    const isAvailable = await this.availabilityService.hasAvailabilitySlots(
      entity.id
    );

    // Get availability slots for this pro
    const availabilitySlots =
      await this.availabilityService.getAvailabilitySlots(entity.id);

    return {
      id: entity.id,
      name: entity.displayName,
      email: entity.email,
      phone: entity.phone ?? undefined,
      bio: entity.bio ?? undefined,
      avatarUrl: entity.avatarUrl ?? undefined,
      hourlyRate: entity.hourlyRate,
      categoryIds: entity.categoryIds,
      serviceArea: entity.serviceArea ?? undefined,
      rating,
      reviewCount,
      isApproved,
      isSuspended,
      isAvailable,
      profileCompleted: entity.profileCompleted,
      completedJobsCount: entity.completedJobsCount,
      isTopPro: entity.isTopPro,
      responseTimeMinutes: entity.responseTimeMinutes ?? undefined,
      availabilitySlots,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

import { injectable, inject } from "tsyringe";
import {
  type ProRepository,
  type ProProfileEntity,
  type ProProfileCreateInput,
} from "./pro.repo";
import type { ReviewRepository } from "@modules/review/review.repo";
import type { UserRepository } from "@modules/user/user.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { ProPayoutProfileRepository } from "@modules/payout/proPayoutProfile.repo";
import type { AuditService } from "@modules/audit/audit.service";
import type { AvailabilityRepository } from "./availability.repo";
import { AuditEventType } from "@modules/audit/audit.repo";
import type {
  Pro,
  ProOnboardInput,
  ProSetAvailabilityInput,
  Category,
} from "@repo/domain";
import { Role, BookingStatus } from "@repo/domain";
import { TOKENS } from "@/server/container/tokens";
import type { Actor } from "@infra/auth/roles";

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
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProPayoutProfileRepository)
    private readonly proPayoutProfileRepository: ProPayoutProfileRepository,
    @inject(TOKENS.AvailabilityRepository)
    private readonly availabilityRepository: AvailabilityRepository,
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
      bio: undefined,
      hourlyRate: input.hourlyRate,
      categories: input.categories.map((c) => c as string),
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
  async convertUserToPro(
    userId: string,
    input: ProOnboardInput
  ): Promise<Pro> {
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
      bio: undefined,
      hourlyRate: input.hourlyRate,
      categories: input.categories.map((c) => c as string),
      serviceArea: input.serviceArea,
    });

    // Map to domain type
    return this.mapToDomain(proProfile);
  }

  /**
   * Get pro by ID
   */
  async getProById(id: string): Promise<Pro | null> {
    const proProfile = await this.proRepository.findById(id);
    if (!proProfile) return null;
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
        // First, delete existing slots to avoid duplicates
        await this.availabilityRepository.deleteByProProfileId(proId);
        
        // Create slots for Monday (1) through Friday (5)
        const defaultSlots = [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Monday
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tuesday
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wednesday
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thursday
          { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Friday
        ];

        for (const slot of defaultSlots) {
          await this.availabilityRepository.create({
            proProfileId: proId,
            ...slot,
          });
        }
      } else {
        // Delete all availability slots
        await this.availabilityRepository.deleteByProProfileId(proId);
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

    // Map ProOnboardInput fields to ProProfileCreateInput fields
    const updateData: Partial<ProProfileCreateInput> = {};
    
    if (input.name !== undefined) {
      updateData.displayName = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.hourlyRate !== undefined) {
      updateData.hourlyRate = input.hourlyRate;
    }
    if (input.categories !== undefined) {
      updateData.categories = input.categories.map((c) => c as string);
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
  }): Promise<Array<{
    id: string;
    displayName: string;
    email: string;
    status: "pending" | "active" | "suspended";
    completedJobsCount: number;
    isPayoutProfileComplete: boolean;
    createdAt: Date;
  }>> {
    const proProfiles = await this.proRepository.findAllWithFilters(filters);

    // Get completed jobs count and payout profile completion for each pro
    const prosWithStats = await Promise.all(
      proProfiles.map(async (pro) => {
        // Get completed bookings count
        const bookings = await this.bookingRepository.findByProProfileId(pro.id);
        const completedJobsCount = bookings.filter(
          (b) => b.status === BookingStatus.COMPLETED
        ).length;

        // Get payout profile completion
        const payoutProfile =
          await this.proPayoutProfileRepository.findByProProfileId(pro.id);
        const isPayoutProfileComplete = payoutProfile?.isComplete ?? false;

        return {
          id: pro.id,
          displayName: pro.displayName,
          email: pro.email,
          status: pro.status,
          completedJobsCount,
          isPayoutProfileComplete,
          createdAt: pro.createdAt,
        };
      })
    );

    return prosWithStats;
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
    hourlyRate: number;
    categories: string[];
    serviceArea: string | null;
    status: "pending" | "active" | "suspended";
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
      hourlyRate: proProfile.hourlyRate,
      categories: proProfile.categories,
      serviceArea: proProfile.serviceArea,
      status: proProfile.status,
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
    const availabilitySlots = await this.availabilityRepository.findByProProfileId(entity.id);
    const isAvailable = availabilitySlots.length > 0;

    // Map categories from string[] to Category[]
    const categories = entity.categories.map(
      (c) => c as Category
    ) as Category[];

    return {
      id: entity.id,
      name: entity.displayName,
      email: entity.email,
      phone: entity.phone ?? undefined,
      hourlyRate: entity.hourlyRate,
      categories,
      serviceArea: entity.serviceArea ?? undefined,
      rating,
      reviewCount,
      isApproved,
      isSuspended,
      isAvailable,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}


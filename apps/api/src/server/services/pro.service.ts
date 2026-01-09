import { proRepository, type ProProfileEntity } from "../repositories/pro.repo";
import { userRepository } from "../repositories/user.repo";
import type {
  Pro,
  ProOnboardInput,
  ProSetAvailabilityInput,
} from "@repo/domain";
import { Role } from "@repo/domain";

/**
 * Pro service
 * Contains business logic for pro operations
 * Note: Temporarily adapts between new repository entities and domain types for router compatibility
 */
export class ProService {
  /**
   * Onboard a new pro
   * Business rules:
   * - User must be created first
   */
  async onboardPro(input: ProOnboardInput): Promise<Pro> {
    // Create user first
    const user = await userRepository.create(Role.PRO);

    // Create pro profile
    const proProfile = await proRepository.create({
      userId: user.id,
      displayName: input.name,
      bio: undefined,
      hourlyRate: input.hourlyRate,
    });

    // Adapt to domain type for router compatibility
    return this.adaptToDomain(proProfile, input);
  }

  /**
   * Get pro by ID
   */
  async getProById(id: string): Promise<Pro | null> {
    const proProfile = await proRepository.findById(id);
    if (!proProfile) return null;
    return proProfile as unknown as Pro;
  }

  /**
   * Get all pros
   */
  async getAllPros(): Promise<Pro[]> {
    const proProfiles = await proRepository.findAll();
    return proProfiles as unknown as Pro[];
  }

  /**
   * Set pro availability
   * Business rules:
   * - Pro must exist
   */
  async setAvailability(
    proId: string,
    input: ProSetAvailabilityInput
  ): Promise<Pro> {
    const pro = await proRepository.findById(proId);
    if (!pro) {
      throw new Error("Pro not found");
    }

    // Update pro profile if needed (for now, just return existing)
    const updated = pro;

    if (!updated) {
      throw new Error("Failed to update pro");
    }

    return updated as unknown as Pro;
  }

  private adaptToDomain(entity: ProProfileEntity, input: ProOnboardInput): Pro {
    return {
      id: entity.id,
      name: entity.displayName,
      email: "", // Not in new schema - would need to be fetched from user
      phone: input.phone,
      hourlyRate: entity.hourlyRate,
      categories: input.categories,
      serviceArea: input.serviceArea,
      rating: undefined,
      reviewCount: 0,
      isApproved: entity.status === "active",
      isSuspended: entity.status === "suspended",
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export const proService = new ProService();

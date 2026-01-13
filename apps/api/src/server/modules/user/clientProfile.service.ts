import { injectable, inject } from "tsyringe";
import type { ClientProfileRepository } from "./clientProfile.repo";
import { TOKENS } from "@/server/container/tokens";

/**
 * ClientProfile service
 * Contains business logic for client profile operations
 */
@injectable()
export class ClientProfileService {
  constructor(
    @inject(TOKENS.ClientProfileRepository)
    private readonly clientProfileRepository: ClientProfileRepository
  ) {}

  /**
   * Ensure a client profile exists for a user
   * If profile exists -> return it
   * Else create minimal empty profile with userId
   */
  async ensureClientProfileExists(userId: string): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // Check if profile exists
    const existing = await this.clientProfileRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Create minimal empty profile
    return await this.clientProfileRepository.createForUser(userId);
  }

  /**
   * Get client profile by user ID
   * Alias for getProfileByUserId for backward compatibility
   */
  async getProfile(userId: string): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const profile = await this.clientProfileRepository.findByUserId(userId);
    if (!profile) {
      // Ensure profile exists if not found
      return await this.ensureClientProfileExists(userId);
    }
    return profile;
  }

  /**
   * Get client profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return await this.clientProfileRepository.findByUserId(userId);
  }

  /**
   * Update client profile
   */
  async updateProfile(
    userId: string,
    data: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return await this.clientProfileRepository.upsertForUser(userId, data);
  }
}

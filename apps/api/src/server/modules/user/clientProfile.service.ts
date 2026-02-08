import { injectable, inject } from "tsyringe";
import type { ClientProfileRepository } from "./clientProfile.repo";
import type { IAvatarCache } from "@modules/avatar/avatar-cache.types";
import { AVATAR_USE_REDIS_CACHE } from "@modules/avatar/avatar-config";
import { avatarCacheKeyClient } from "@modules/avatar/avatar-cache";
import { TOKENS } from "@/server/container/tokens";

/**
 * ClientProfile service
 * Contains business logic for client profile operations
 */
@injectable()
export class ClientProfileService {
  constructor(
    @inject(TOKENS.ClientProfileRepository)
    private readonly clientProfileRepository: ClientProfileRepository,
    @inject(TOKENS.IAvatarCache)
    private readonly avatarCache: IAvatarCache
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
    avatarUrl: string | null;
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
    avatarUrl: string | null;
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
    avatarUrl: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return await this.clientProfileRepository.findByUserId(userId);
  }

  /**
   * Update client profile
   * When avatarUrl is set, it must be a storage path from client_avatar upload (client/{userId}/...).
   */
  async updateProfile(
    userId: string,
    data: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    if (
      data.avatarUrl !== undefined &&
      data.avatarUrl !== null &&
      data.avatarUrl !== ""
    ) {
      const isLegacyUrl =
        data.avatarUrl.startsWith("http://") ||
        data.avatarUrl.startsWith("https://");
      const prefix = `client/${userId}/`;
      if (!isLegacyUrl && !data.avatarUrl.startsWith(prefix)) {
        throw new Error(
          `avatarUrl must be a storage path starting with ${prefix} (from avatar upload)`
        );
      }
    }
    const profile = await this.clientProfileRepository.upsertForUser(
      userId,
      data
    );
    if (data.avatarUrl !== undefined && AVATAR_USE_REDIS_CACHE) {
      await this.avatarCache.invalidate(avatarCacheKeyClient(userId));
    }
    return profile;
  }

  /**
   * Anonymize client profile (remove PII for GDPR compliance)
   * Keeps profile record but removes all personally identifiable information
   */
  async anonymizeProfile(userId: string): Promise<{
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return await this.clientProfileRepository.upsertForUser(userId, {
      email: null,
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
      preferredContactMethod: null,
    });
  }
}

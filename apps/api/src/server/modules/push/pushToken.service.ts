import { injectable, inject } from "tsyringe";
import type { Actor } from "@infra/auth/roles";
import type { DevicePushTokenRepository } from "./devicePushToken.repo";
import { TOKENS } from "@/server/container";
import { $Enums } from "../../../../prisma/generated/prisma/client";

/**
 * Push token registration input
 */
export interface PushTokenRegisterInput {
  platform: "IOS" | "ANDROID";
  token: string;
}

/**
 * Push token unregistration input
 */
export interface PushTokenUnregisterInput {
  token: string;
}

/**
 * Push token service
 * Handles business logic for push token registration
 */
@injectable()
export class PushTokenService {
  constructor(
    @inject(TOKENS.DevicePushTokenRepository)
    private readonly devicePushTokenRepository: DevicePushTokenRepository
  ) {}

  /**
   * Register a push token for the authenticated user
   * Requires actor to be logged in
   */
  async registerToken(actor: Actor, input: PushTokenRegisterInput): Promise<void> {
    await this.devicePushTokenRepository.upsertToken({
      userId: actor.id,
      provider: $Enums.PushProvider.EXPO,
      platform: input.platform === "IOS" ? $Enums.DevicePlatform.IOS : $Enums.DevicePlatform.ANDROID,
      token: input.token,
    });
  }

  /**
   * Unregister a push token for the authenticated user
   * Requires actor to be logged in
   */
  async unregisterToken(actor: Actor, input: PushTokenUnregisterInput): Promise<void> {
    await this.devicePushTokenRepository.deactivateToken(input.token);
  }
}

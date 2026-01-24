import { injectable, inject } from "tsyringe";
import type { DevicePushTokenRepository } from "../push/devicePushToken.repo";
import { TOKENS } from "@/server/container/tokens";

/**
 * Error thrown when no active push tokens are found for a user
 */
export class NoActivePushTokensError extends Error {
  constructor(userId: string) {
    super(`No active push tokens found for user: ${userId}`);
    this.name = "NoActivePushTokensError";
  }
}

/**
 * Push delivery resolver
 * Resolves user IDs to device push tokens for PUSH channel notifications
 */
@injectable()
export class PushDeliveryResolver {
  constructor(
    @inject(TOKENS.DevicePushTokenRepository)
    private readonly devicePushTokenRepository: DevicePushTokenRepository
  ) {}

  /**
   * Resolve user ID to active Expo push tokens
   * @param recipientUserId The user ID to resolve tokens for
   * @returns Array of Expo push tokens (strings)
   * @throws NoActivePushTokensError if no active tokens found
   */
  async resolvePushTokens(recipientUserId: string): Promise<string[]> {
    const tokens =
      await this.devicePushTokenRepository.listActiveTokensByUserId(
        recipientUserId
      );

    if (tokens.length === 0) {
      throw new NoActivePushTokensError(recipientUserId);
    }

    return tokens;
  }
}

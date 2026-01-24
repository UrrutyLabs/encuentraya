import type {
  NotificationProvider,
  NotificationMessage,
  NotificationSendResult,
} from "../provider";
import { PushDeliveryResolver } from "../pushResolver";

/**
 * Stub push notification provider for development/testing
 * Pretends to send push notifications without actually sending them
 *
 * For PUSH channel:
 * - recipientRef is userId
 * - Resolves userId to device tokens using PushDeliveryResolver
 * - Throws NoActivePushTokensError if no tokens found
 */
export class StubPushProvider implements NotificationProvider {
  constructor(private readonly pushResolver: PushDeliveryResolver) {}

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    // For PUSH channel, recipientRef is userId
    if (message.channel === "PUSH") {
      // Resolve userId to device tokens
      const tokens = await this.pushResolver.resolvePushTokens(
        message.recipientRef
      );

      // If no tokens found, resolver throws NoActivePushTokensError
      // This will be caught by NotificationService and marked as FAILED

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Pretend to send and return provider metadata with token count for debug
      return {
        provider: "stub-push",
        providerMessageId: `stub-push-${Date.now()}-tokens:${tokens.length}-${Math.random().toString(36).substring(7)}`,
      };
    }

    // Fallback (should not happen for PUSH channel)
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      provider: "stub-push",
      providerMessageId: `stub-push-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

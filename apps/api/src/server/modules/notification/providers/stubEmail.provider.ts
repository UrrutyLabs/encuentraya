import type { NotificationProvider, NotificationMessage, NotificationSendResult } from "../provider";

/**
 * Stub email provider for development/testing
 * Pretends to send emails without actually sending them
 */
export class StubEmailProvider implements NotificationProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Stub provider doesn't use message
  async send(_message: NotificationMessage): Promise<NotificationSendResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Pretend to send and return provider metadata
    return {
      provider: "stub-email",
      providerMessageId: `stub-email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

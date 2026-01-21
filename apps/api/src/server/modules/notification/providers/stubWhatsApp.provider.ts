import type { NotificationProvider, NotificationMessage, NotificationSendResult } from "../provider";

/**
 * Stub WhatsApp provider for development/testing
 * Pretends to send WhatsApp messages without actually sending them
 */
export class StubWhatsAppProvider implements NotificationProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Stub provider doesn't use message
  async send(_message: NotificationMessage): Promise<NotificationSendResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Pretend to send and return provider metadata
    return {
      provider: "stub-whatsapp",
      providerMessageId: `stub-whatsapp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

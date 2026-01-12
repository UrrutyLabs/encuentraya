/**
 * Notification message type
 * Represents a notification to be sent through a provider
 */
export interface NotificationMessage {
  channel: "EMAIL" | "WHATSAPP" | "PUSH";
  recipientRef: string;
  templateId: string;
  payload: unknown;
  idempotencyKey: string;
}

/**
 * Result of sending a notification
 */
export interface NotificationSendResult {
  provider: string;
  providerMessageId?: string;
}

/**
 * Notification provider interface
 * Implementations should be provider-specific (e.g., EmailProvider, WhatsAppProvider, PushProvider)
 */
export interface NotificationProvider {
  /**
   * Send a notification message
   * Returns provider identifier and optional provider message ID
   */
  send(message: NotificationMessage): Promise<NotificationSendResult>;
}

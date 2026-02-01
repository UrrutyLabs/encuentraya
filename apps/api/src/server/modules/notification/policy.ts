import type { NotificationMessage } from "./provider";

/**
 * Event types that trigger notifications
 */
export type NotificationEvent =
  | "order.created"
  | "order.accepted"
  | "order.confirmed"
  | "order.in_progress"
  | "order.arrived"
  | "order.awaiting_approval"
  | "order.completed"
  | "order.disputed"
  | "order.canceled"
  | "payment.required"
  | "payment.authorized"
  | "review.received"
  | "chat.new_message";

/**
 * Recipient role (determines channel preferences)
 */
export type RecipientRole = "CLIENT" | "PRO";

/**
 * Build notification messages for an event
 * Returns array of NotificationMessage objects with deterministic idempotencyKeys
 *
 * Channel selection rules:
 * - CLIENT: EMAIL always; WHATSAPP only for important events
 * - PRO: PUSH always; WHATSAPP only for important/fallback
 */
export function buildNotificationMessages(params: {
  event: NotificationEvent;
  resourceId: string; // Order ID or other resource ID
  recipientRef: string;
  recipientRole: RecipientRole;
  templateId: string;
  payload: unknown;
}): NotificationMessage[] {
  const {
    event,
    resourceId,
    recipientRef,
    recipientRole,
    templateId,
    payload,
  } = params;

  // Determine if event is "important" (triggers WhatsApp)
  const importantEvents: NotificationEvent[] = [
    "order.created",
    "order.accepted",
    "order.awaiting_approval",
    "order.completed",
    "order.disputed",
    "order.canceled",
    "payment.required",
    "chat.new_message",
  ];
  const isImportant = importantEvents.includes(event);

  const messages: NotificationMessage[] = [];

  if (recipientRole === "CLIENT") {
    // CLIENT: EMAIL always
    messages.push({
      channel: "EMAIL",
      recipientRef,
      templateId,
      payload,
      idempotencyKey: `${event}:${resourceId}:${recipientRef}:EMAIL`,
    });

    // CLIENT: WHATSAPP only for important events
    if (isImportant) {
      messages.push({
        channel: "WHATSAPP",
        recipientRef,
        templateId,
        payload,
        idempotencyKey: `${event}:${resourceId}:${recipientRef}:WHATSAPP`,
      });
    }
  } else if (recipientRole === "PRO") {
    // PRO: PUSH always
    messages.push({
      channel: "PUSH",
      recipientRef,
      templateId,
      payload,
      idempotencyKey: `${event}:${resourceId}:${recipientRef}:PUSH`,
    });

    // PRO: WHATSAPP only for important/fallback
    if (isImportant) {
      messages.push({
        channel: "WHATSAPP",
        recipientRef,
        templateId,
        payload,
        idempotencyKey: `${event}:${resourceId}:${recipientRef}:WHATSAPP`,
      });
    }
  }

  return messages;
}

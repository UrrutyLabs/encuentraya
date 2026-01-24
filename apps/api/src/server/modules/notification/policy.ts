import type { NotificationMessage } from "./provider";

/**
 * Event types that trigger notifications
 */
export type NotificationEvent =
  | "booking.created"
  | "booking.accepted"
  | "booking.rejected"
  | "booking.on_my_way"
  | "booking.arrived"
  | "booking.completed"
  | "booking.cancelled"
  | "payment.required"
  | "payment.authorized"
  | "review.received";

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
  bookingId: string;
  recipientRef: string;
  recipientRole: RecipientRole;
  templateId: string;
  payload: unknown;
}): NotificationMessage[] {
  const { event, bookingId, recipientRef, recipientRole, templateId, payload } =
    params;

  // Determine if event is "important" (triggers WhatsApp)
  const importantEvents: NotificationEvent[] = [
    "booking.accepted",
    "booking.rejected",
    "booking.on_my_way",
    "booking.arrived",
    "booking.completed",
    "payment.required",
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
      idempotencyKey: `${event}:${bookingId}:${recipientRef}:EMAIL`,
    });

    // CLIENT: WHATSAPP only for important events
    if (isImportant) {
      messages.push({
        channel: "WHATSAPP",
        recipientRef,
        templateId,
        payload,
        idempotencyKey: `${event}:${bookingId}:${recipientRef}:WHATSAPP`,
      });
    }
  } else if (recipientRole === "PRO") {
    // PRO: PUSH always
    messages.push({
      channel: "PUSH",
      recipientRef,
      templateId,
      payload,
      idempotencyKey: `${event}:${bookingId}:${recipientRef}:PUSH`,
    });

    // PRO: WHATSAPP only for important/fallback
    if (isImportant) {
      messages.push({
        channel: "WHATSAPP",
        recipientRef,
        templateId,
        payload,
        idempotencyKey: `${event}:${bookingId}:${recipientRef}:WHATSAPP`,
      });
    }
  }

  return messages;
}

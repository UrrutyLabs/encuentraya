import type { BookingEntity } from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type {
  Booking,
  BookingCreateInput,
  BookingCreateOutput,
  Category,
} from "@repo/domain";
import { BookingStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
} from "./booking.errors";
import type { NotificationService } from "@modules/notification/notification.service";
import type { NotificationEvent } from "@modules/notification/policy";
import type { ClientProfileService } from "@modules/user/clientProfile.service";

/**
 * Validate state transition according to state machine rules:
 * PENDING -> ACCEPTED | REJECTED | CANCELLED
 * ACCEPTED -> ARRIVED | CANCELLED
 * ARRIVED -> COMPLETED
 */
export function validateStateTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): void {
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING_PAYMENT]: [
      BookingStatus.PENDING,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.PENDING]: [
      BookingStatus.ACCEPTED,
      BookingStatus.REJECTED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.ACCEPTED]: [
      BookingStatus.ON_MY_WAY,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.ON_MY_WAY]: [BookingStatus.ARRIVED, BookingStatus.CANCELLED],
    [BookingStatus.ARRIVED]: [BookingStatus.COMPLETED],
    [BookingStatus.REJECTED]: [], // Terminal state
    [BookingStatus.COMPLETED]: [], // Terminal state
    [BookingStatus.CANCELLED]: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new InvalidBookingStateError(currentStatus, targetStatus);
  }
}

/**
 * Map BookingEntity to Booking domain type
 */
export function mapBookingEntityToDomain(
  entity: BookingEntity,
  hourlyRate: number
): Booking {
  return {
    id: entity.id,
    displayId: entity.displayId,
    clientId: entity.clientUserId,
    proId: entity.proProfileId || "",
    category: entity.category as Category,
    description: entity.addressText,
    status: entity.status,
    scheduledAt: entity.scheduledAt,
    completedAt: undefined,
    cancelledAt: undefined,
    hourlyRate,
    estimatedHours: entity.hoursEstimate,
    totalAmount: hourlyRate * entity.hoursEstimate,
    isFirstBooking: entity.isFirstBooking,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Adapt BookingEntity to BookingCreateOutput domain type
 */
export function adaptToDomain(
  entity: BookingEntity,
  input: BookingCreateInput,
  hourlyRate: number
): BookingCreateOutput {
  return {
    id: entity.id,
    displayId: entity.displayId,
    clientId: entity.clientUserId,
    proId: entity.proProfileId || input.proId,
    category: input.category,
    description: entity.addressText,
    status: entity.status,
    scheduledAt: entity.scheduledAt,
    completedAt: undefined,
    cancelledAt: undefined,
    hourlyRate,
    estimatedHours: entity.hoursEstimate,
    totalAmount: hourlyRate * entity.hoursEstimate,
    isFirstBooking: entity.isFirstBooking,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Authorize pro action on a booking
 * Throws UnauthorizedBookingActionError if not authorized
 */
export async function authorizeProAction(
  actor: Actor,
  booking: BookingEntity,
  action: string,
  proRepository: ProRepository
): Promise<void> {
  if (actor.role === Role.ADMIN) {
    return; // Admin can perform any action
  }

  if (actor.role !== Role.PRO) {
    throw new UnauthorizedBookingActionError(
      action,
      "Only pros can perform this action"
    );
  }

  // Get pro profile for actor
  const proProfile = await proRepository.findByUserId(actor.id);
  if (!proProfile) {
    throw new UnauthorizedBookingActionError(action, "Pro profile not found");
  }

  if (booking.proProfileId !== proProfile.id) {
    throw new UnauthorizedBookingActionError(
      action,
      "Booking is not assigned to this pro"
    );
  }
}

/**
 * Authorize client action on a booking
 * Throws UnauthorizedBookingActionError if not authorized
 */
export function authorizeClientAction(
  actor: Actor,
  booking: BookingEntity,
  action: string
): void {
  if (actor.role === Role.ADMIN) {
    return; // Admin can perform any action
  }

  if (actor.role !== Role.CLIENT) {
    throw new UnauthorizedBookingActionError(
      action,
      "Only clients can perform this action"
    );
  }

  if (booking.clientUserId !== actor.id) {
    throw new UnauthorizedBookingActionError(
      action,
      "Booking does not belong to this client"
    );
  }
}

/**
 * Send notification to client for a booking event
 * Always sends EMAIL if client has email
 * Sends WHATSAPP for important events if client has phone and prefers WhatsApp
 * Silently fails if notification fails (doesn't affect booking operation)
 */
export async function sendClientNotification(
  booking: BookingEntity,
  event: NotificationEvent,
  subject: string,
  text: string,
  html: string | undefined,
  notificationService: NotificationService,
  clientProfileService: ClientProfileService,
  proRepository: ProRepository
): Promise<void> {
  try {
    // Get client profile to get email and phone
    const clientProfile = await clientProfileService.getProfileByUserId(
      booking.clientUserId
    );

    // Only send if client has an email (email is always required)
    if (!clientProfile?.email) {
      return;
    }

    // Get pro info for notification content
    const pro = booking.proProfileId
      ? await proRepository.findById(booking.proProfileId)
      : null;
    const proName = pro?.displayName || "el profesional";

    const payload = {
      subject,
      text,
      html: html || text,
      bookingId: booking.id,
      proName,
      scheduledAt: booking.scheduledAt.toLocaleString("es-UY"),
    };

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

    // Always send EMAIL if client has email
    const emailMessage = {
      channel: "EMAIL" as const,
      recipientRef: clientProfile.email,
      templateId: event,
      payload,
      idempotencyKey: `${event}:${booking.id}:${clientProfile.email}:EMAIL`,
    };
    await notificationService.deliverNow(emailMessage).catch((error) => {
      console.error(
        `Failed to send EMAIL notification for booking ${booking.id}:`,
        error
      );
    });

    // Send WHATSAPP only for important events if client has phone and prefers WhatsApp
    if (
      isImportant &&
      clientProfile.phone &&
      clientProfile.preferredContactMethod === "WHATSAPP"
    ) {
      const whatsappMessage = {
        channel: "WHATSAPP" as const,
        recipientRef: clientProfile.phone,
        templateId: event,
        payload,
        idempotencyKey: `${event}:${booking.id}:${clientProfile.phone}:WHATSAPP`,
      };
      await notificationService.deliverNow(whatsappMessage).catch((error) => {
        console.error(
          `Failed to send WHATSAPP notification for booking ${booking.id}:`,
          error
        );
      });
    }
  } catch (error) {
    // Log but don't fail booking operation if notification fails
    console.error(
      `Error sending notification for booking ${booking.id}:`,
      error
    );
  }
}

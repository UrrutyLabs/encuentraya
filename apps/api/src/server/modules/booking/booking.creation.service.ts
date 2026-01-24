import { injectable, inject } from "tsyringe";
import type { BookingRepository } from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { BookingCreateInput, BookingCreateOutput } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import { adaptToDomain, sendClientNotification } from "./booking.helpers";

/**
 * Booking creation service
 * Handles booking creation workflow
 */
@injectable()
export class BookingCreationService {
  constructor(
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Create a new booking
   * Business rules:
   * - Pro must exist and be active
   * - Set initial status to PENDING_PAYMENT (payment required before pro can accept)
   * - Scheduled date must be today or in the future
   * - If scheduled date is today, scheduled time must be in the future
   */
  async createBooking(
    actor: Actor,
    input: BookingCreateInput
  ): Promise<BookingCreateOutput> {
    // Validate scheduled date/time: only allow today (if time is valid) or future dates
    const now = new Date();
    const scheduledAt = input.scheduledAt;

    // Validate time is at hour or half-hour (00 or 30 minutes)
    const scheduledMinutes = scheduledAt.getUTCMinutes();
    if (scheduledMinutes !== 0 && scheduledMinutes !== 30) {
      throw new Error(
        "Booking time must be at the hour or half-hour (e.g., 13:00 or 13:30)"
      );
    }

    // Get today's date in UTC (date-only, no time)
    const todayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Get scheduled date in UTC (date-only, no time)
    const scheduledDateUTC = new Date(
      Date.UTC(
        scheduledAt.getUTCFullYear(),
        scheduledAt.getUTCMonth(),
        scheduledAt.getUTCDate()
      )
    );

    // Check if scheduled date is in the past
    if (scheduledDateUTC < todayUTC) {
      throw new Error("Cannot create booking for dates in the past");
    }

    // If scheduled date is today, check if scheduled time has already passed
    if (scheduledDateUTC.getTime() === todayUTC.getTime()) {
      if (scheduledAt <= now) {
        throw new Error("Cannot create booking for times in the past");
      }
    }

    // Ensure client profile exists (lazy creation)
    await this.clientProfileService.ensureClientProfileExists(actor.id);

    // Validate pro exists
    const pro = await this.proRepository.findById(input.proId);
    if (!pro) {
      throw new Error("Pro not found");
    }

    if (pro.status === "suspended") {
      throw new Error("Pro is suspended");
    }

    // Check if this is the client's first booking
    const existingBookings = await this.bookingRepository.findByClientUserId(
      actor.id
    );
    const isFirstBooking = existingBookings.length === 0;

    // Create booking via repository
    const booking = await this.bookingRepository.create({
      clientUserId: actor.id,
      proProfileId: input.proId,
      category: input.category as string,
      scheduledAt: input.scheduledAt,
      hoursEstimate: input.estimatedHours,
      addressText: input.description,
      isFirstBooking,
    });

    // Send notification to client
    await sendClientNotification(
      booking,
      "booking.created",
      "Tu reserva fue creada",
      `Tu reserva #${booking.id} fue creada exitosamente. El profesional ${pro.displayName} recibirá tu solicitud.`,
      `<p>Tu reserva <strong>#${booking.id}</strong> fue creada exitosamente.</p><p>El profesional <strong>${pro.displayName}</strong> recibirá tu solicitud y te notificaremos cuando la acepte.</p>`,
      this.notificationService,
      this.clientProfileService,
      this.proRepository
    );

    // Adapt to domain type for router compatibility
    return adaptToDomain(booking, input, pro.hourlyRate);
  }
}

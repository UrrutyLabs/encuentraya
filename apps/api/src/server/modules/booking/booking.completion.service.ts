import { injectable, inject } from "tsyringe";
import type { BookingRepository, BookingEntity } from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import { BookingStatus, PaymentStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import { BookingNotFoundError } from "./booking.errors";
import type { PaymentServiceFactory } from "@/server/container";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import type { EarningService } from "@modules/payout/earning.service";
import {
  validateStateTransition,
  authorizeProAction,
  sendClientNotification,
} from "./booking.helpers";

/**
 * Booking completion service
 * Handles booking completion workflow including payment capture and earning creation
 */
@injectable()
export class BookingCompletionService {
  constructor(
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.PaymentServiceFactory)
    private readonly paymentServiceFactory: PaymentServiceFactory,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.NotificationService)
    private readonly notificationService: NotificationService,
    @inject(TOKENS.EarningService)
    private readonly earningService: EarningService
  ) {}

  /**
   * Get booking or throw error
   */
  private async getBookingOrThrow(bookingId: string): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }
    return booking;
  }

  /**
   * Complete a booking (ARRIVED -> COMPLETED)
   * Authorization: Pro assigned to booking or Admin
   *
   * Business rules:
   * - Captures payment if authorized
   * - Creates earning record after successful payment capture
   */
  async completeBooking(
    actor: Actor,
    bookingId: string
  ): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    validateStateTransition(booking.status, BookingStatus.COMPLETED);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    await authorizeProAction(
      actor,
      booking,
      "complete booking",
      this.proRepository
    );

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.COMPLETED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    // Capture payment if it exists and is authorized
    // This ensures funds are charged when work is completed
    try {
      const payment = await this.paymentRepository.findByBookingId(bookingId);

      if (payment && payment.status === PaymentStatus.AUTHORIZED) {
        // Get payment service using factory
        const paymentService = await this.paymentServiceFactory(
          payment.provider
        );

        // Attempt to capture payment (non-blocking - if it fails, booking still completes)
        // Payment can be captured manually later if needed
        await paymentService
          .capturePayment(payment.id)
          .then(async () => {
            // After successful capture, create earning record
            // Use system actor since this is an automated process
            try {
              await this.earningService.createEarningForCompletedBooking(
                { role: "SYSTEM" },
                bookingId
              );
            } catch (error) {
              // Log but don't fail booking completion if earning creation fails
              console.error(
                `Failed to create earning for booking ${bookingId}:`,
                error
              );
            }
          })
          .catch((error) => {
            console.error(
              `Failed to capture payment ${payment.id} for booking ${bookingId}:`,
              error
            );
            // Don't throw - booking completion should succeed even if capture fails
          });
      } else if (payment && payment.status === PaymentStatus.CAPTURED) {
        // Payment already captured, create earning record
        try {
          await this.earningService.createEarningForCompletedBooking(
            { role: "SYSTEM" },
            bookingId
          );
        } catch (error) {
          // Log but don't fail booking completion if earning creation fails
          console.error(
            `Failed to create earning for booking ${bookingId}:`,
            error
          );
        }
      }
    } catch (error) {
      // Log but don't fail booking completion if payment capture fails
      console.error(
        `Error attempting to capture payment for booking ${bookingId}:`,
        error
      );
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await sendClientNotification(
      updated,
      "booking.completed",
      "Tu reserva fue completada",
      `Tu reserva #${updated.id} fue completada por ${pro?.displayName || "el profesional"}. ¡Gracias por usar nuestro servicio!`,
      `<p>¡Tu reserva fue completada!</p><p>Reserva <strong>#${updated.id}</strong> completada por <strong>${pro?.displayName || "el profesional"}</strong>.</p><p>¡Gracias por usar nuestro servicio!</p>`,
      this.notificationService,
      this.clientProfileService,
      this.proRepository
    );

    return updated;
  }
}

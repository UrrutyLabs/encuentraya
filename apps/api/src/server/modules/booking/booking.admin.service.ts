import { injectable, inject } from "tsyringe";
import type { BookingRepository } from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { Booking, BookingStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import { BookingNotFoundError } from "./booking.errors";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { AuditService } from "@modules/audit/audit.service";
import { AuditEventType } from "@modules/audit/audit.repo";
import { mapBookingEntityToDomain } from "./booking.helpers";

/**
 * Booking admin service
 * Handles admin operations (list, getById, forceStatus)
 */
@injectable()
export class BookingAdminService {
  constructor(
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.AuditService)
    private readonly auditService: AuditService
  ) {}

  /**
   * Get booking or throw error
   */
  private async getBookingOrThrow(bookingId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }
    return booking;
  }

  /**
   * Admin: List all bookings with filters
   * Returns bookings with client and pro info
   */
  async adminListBookings(filters?: {
    status?: BookingStatus;
    query?: string; // Search by client email or pro name
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    cursor?: string;
  }): Promise<
    Array<{
      id: string;
      createdAt: Date;
      status: BookingStatus;
      clientEmail: string | null;
      clientName: string | null;
      proName: string | null;
      estimatedAmount: number;
      paymentStatus: string | null;
      currency: string;
    }>
  > {
    // Get bookings with filters
    const bookings = await this.bookingRepository.findAll({
      status: filters?.status,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      limit: filters?.limit,
      cursor: filters?.cursor,
    });

    // Get client and pro info
    const clientIds = [...new Set(bookings.map((b) => b.clientUserId))];
    const proIds = bookings
      .map((b) => b.proProfileId)
      .filter((id): id is string => id !== null);

    // Get client profiles
    const clientProfiles = await Promise.all(
      clientIds.map((id) =>
        this.clientProfileService.getProfile(id).catch(() => null)
      )
    );
    const clientMap = new Map(
      clientProfiles
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.userId, p])
    );

    // Get pro profiles
    const pros = await Promise.all(
      proIds.map((id) => this.proRepository.findById(id))
    );
    const proMap = new Map(
      pros
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.id, p])
    );

    // Get payments for bookings
    const payments = await Promise.all(
      bookings.map((b) =>
        this.paymentRepository.findByBookingId(b.id).catch(() => null)
      )
    );
    const paymentMap = new Map(
      payments
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.bookingId, p])
    );

    // Combine and filter by query if provided
    let results = bookings.map((booking) => {
      const clientProfile = clientMap.get(booking.clientUserId);
      const pro = booking.proProfileId
        ? proMap.get(booking.proProfileId)
        : null;
      const payment = paymentMap.get(booking.id);
      const hourlyRate = pro?.hourlyRate ?? 0;
      const estimatedAmount = hourlyRate * booking.hoursEstimate;

      return {
        id: booking.id,
        createdAt: booking.createdAt,
        status: booking.status,
        clientEmail: clientProfile?.email ?? null,
        clientName: clientProfile
          ? `${clientProfile.firstName || ""} ${clientProfile.lastName || ""}`.trim() ||
            null
          : null,
        proName: pro?.displayName ?? null,
        estimatedAmount,
        paymentStatus: payment?.status ?? null,
        currency: payment?.currency ?? "UYU",
      };
    });

    // Filter by query (search in client email or pro name)
    if (filters?.query) {
      const queryLower = filters.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.clientEmail?.toLowerCase().includes(queryLower) ||
          r.clientName?.toLowerCase().includes(queryLower) ||
          r.proName?.toLowerCase().includes(queryLower)
      );
    }

    return results;
  }

  /**
   * Admin: Get booking by ID with full details
   * Returns booking with client and pro info, payment, and address
   */
  async adminGetBookingById(bookingId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: BookingStatus;
    category: string;
    scheduledAt: Date;
    hoursEstimate: number;
    addressText: string;
    client: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
    };
    pro: {
      id: string;
      displayName: string;
      email: string;
      phone: string | null;
    } | null;
    payment: {
      id: string;
      status: string;
      amountEstimated: number;
      amountAuthorized: number | null;
      amountCaptured: number | null;
      currency: string;
    } | null;
    estimatedAmount: number;
  }> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Get client profile
    const clientProfile = await this.clientProfileService.getProfile(
      booking.clientUserId
    );

    // Get pro profile
    const pro = booking.proProfileId
      ? await this.proRepository.findById(booking.proProfileId)
      : null;

    // Get payment
    const payment = await this.paymentRepository.findByBookingId(bookingId);

    const hourlyRate = pro?.hourlyRate ?? 0;
    const estimatedAmount = hourlyRate * booking.hoursEstimate;

    return {
      id: booking.id,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      status: booking.status,
      category: booking.category,
      scheduledAt: booking.scheduledAt,
      hoursEstimate: booking.hoursEstimate,
      addressText: booking.addressText,
      client: {
        id: booking.clientUserId,
        email: clientProfile.email,
        firstName: clientProfile.firstName,
        lastName: clientProfile.lastName,
        phone: clientProfile.phone,
      },
      pro: pro
        ? {
            id: pro.id,
            displayName: pro.displayName,
            email: pro.email,
            phone: pro.phone,
          }
        : null,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            amountEstimated: payment.amountEstimated,
            amountAuthorized: payment.amountAuthorized,
            amountCaptured: payment.amountCaptured,
            currency: payment.currency,
          }
        : null,
      estimatedAmount,
    };
  }

  /**
   * Admin: Force update booking status (bypasses state machine validation)
   * Use with caution - only for admin operations
   * Returns Booking domain type
   */
  async adminForceStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actor: Actor
  ): Promise<Booking> {
    const booking = await this.getBookingOrThrow(bookingId);

    const previousStatus = booking.status;

    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      newStatus
    );

    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    // Log audit event
    await this.auditService.logEvent({
      eventType: AuditEventType.BOOKING_STATUS_FORCED,
      actor,
      resourceType: "booking",
      resourceId: bookingId,
      action: "force_status",
      metadata: {
        previousStatus,
        newStatus,
        clientUserId: booking.clientUserId,
        proProfileId: booking.proProfileId || null,
        category: booking.category,
      },
    });

    // Get pro to get hourly rate for domain mapping
    const pro = updated.proProfileId
      ? await this.proRepository.findById(updated.proProfileId)
      : null;
    const hourlyRate = pro?.hourlyRate ?? 0;

    return mapBookingEntityToDomain(updated, hourlyRate);
  }
}

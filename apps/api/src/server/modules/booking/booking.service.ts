import { injectable, inject } from "tsyringe";
import {
  type BookingRepository,
  type BookingEntity,
} from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type {
  Booking,
  BookingCreateInput,
  BookingCreateOutput,
  Category,
} from "@repo/domain";
import { BookingStatus, PaymentStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
  BookingNotFoundError,
} from "./booking.errors";
import { TOKENS } from "@/server/container/tokens";
import type { PaymentServiceFactory } from "@/server/container";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import type { NotificationService } from "@modules/notification/notification.service";
import type { NotificationEvent } from "@modules/notification/policy";
import type { EarningService } from "@modules/payout/earning.service";
import type { AuditService } from "@modules/audit/audit.service";
import { AuditEventType } from "@modules/audit/audit.repo";

/**
 * Booking service
 * Contains business logic for booking operations including state machine
 * Note: Temporarily adapts between new repository entities and domain types for router compatibility
 */
@injectable()
export class BookingService {
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
    private readonly earningService: EarningService,
    @inject(TOKENS.AuditService)
    private readonly auditService: AuditService
  ) {}
  /**
   * Create a new booking
   * Business rules:
   * - Pro must exist and be active
   * - Set initial status to PENDING_PAYMENT (payment required before pro can accept)
   */
  async createBooking(
    actor: Actor,
    input: BookingCreateInput
  ): Promise<BookingCreateOutput> {
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

    // Create booking via repository
    const booking = await this.bookingRepository.create({
      clientUserId: actor.id,
      proProfileId: input.proId,
      category: input.category as string,
      scheduledAt: input.scheduledAt,
      hoursEstimate: input.estimatedHours,
      addressText: input.description,
    });

    // Send notification to client
    await this.sendClientNotification(
      booking,
      "booking.created",
      "Tu reserva fue creada",
      `Tu reserva #${booking.id} fue creada exitosamente. El profesional ${pro.displayName} recibirá tu solicitud.`,
      `<p>Tu reserva <strong>#${booking.id}</strong> fue creada exitosamente.</p><p>El profesional <strong>${pro.displayName}</strong> recibirá tu solicitud y te notificaremos cuando la acepte.</p>`
    );

    // Adapt to domain type for router compatibility
    return this.adaptToDomain(booking, input, pro.hourlyRate);
  }

  /**
   * Accept a booking (PENDING -> ACCEPTED)
   * Authorization: Pro assigned to booking or Admin
   */
  async acceptBooking(actor: Actor, bookingId: string): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.ACCEPTED);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.PRO) {
        throw new UnauthorizedBookingActionError(
          "accept booking",
          "Only pros can accept bookings"
        );
      }

      // Get pro profile for actor
      const proProfile = await this.proRepository.findByUserId(actor.id);
      if (!proProfile) {
        throw new UnauthorizedBookingActionError(
          "accept booking",
          "Pro profile not found"
        );
      }

      if (booking.proProfileId !== proProfile.id) {
        throw new UnauthorizedBookingActionError(
          "accept booking",
          "Booking is not assigned to this pro"
        );
      }
    }

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.ACCEPTED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await this.sendClientNotification(
      updated,
      "booking.accepted",
      "¡Tu reserva fue aceptada!",
      `Tu reserva #${updated.id} fue aceptada por ${pro?.displayName || "el profesional"}.`,
      `<p>¡Excelente noticia!</p><p>Tu reserva <strong>#${updated.id}</strong> fue aceptada por <strong>${pro?.displayName || "el profesional"}</strong>.</p><p>Te notificaremos cuando esté en camino.</p>`
    );

    return updated;
  }

  /**
   * Reject a booking (PENDING -> REJECTED)
   * Authorization: Pro assigned to booking or Admin
   */
  async rejectBooking(actor: Actor, bookingId: string): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.REJECTED);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.PRO) {
        throw new UnauthorizedBookingActionError(
          "reject booking",
          "Only pros can reject bookings"
        );
      }

      // Get pro profile for actor
      const proProfile = await this.proRepository.findByUserId(actor.id);
      if (!proProfile) {
        throw new UnauthorizedBookingActionError(
          "reject booking",
          "Pro profile not found"
        );
      }

      if (booking.proProfileId !== proProfile.id) {
        throw new UnauthorizedBookingActionError(
          "reject booking",
          "Booking is not assigned to this pro"
        );
      }
    }

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.REJECTED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await this.sendClientNotification(
      updated,
      "booking.rejected",
      "Tu reserva fue rechazada",
      `Lamentablemente, tu reserva #${updated.id} fue rechazada por ${pro?.displayName || "el profesional"}.`,
      `<p>Lamentablemente, tu reserva <strong>#${updated.id}</strong> fue rechazada por <strong>${pro?.displayName || "el profesional"}</strong>.</p><p>Podés buscar otro profesional disponible.</p>`
    );

    return updated;
  }

  /**
   * Mark booking as on my way (ACCEPTED -> ON_MY_WAY)
   * Authorization: Pro assigned to booking or Admin
   */
  async markOnMyWay(actor: Actor, bookingId: string): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.ON_MY_WAY);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.PRO) {
        throw new UnauthorizedBookingActionError(
          "mark on my way",
          "Only pros can mark bookings as on my way"
        );
      }

      // Get pro profile for actor
      const proProfile = await this.proRepository.findByUserId(actor.id);
      if (!proProfile) {
        throw new UnauthorizedBookingActionError(
          "mark on my way",
          "Pro profile not found"
        );
      }

      if (booking.proProfileId !== proProfile.id) {
        throw new UnauthorizedBookingActionError(
          "mark on my way",
          "Booking is not assigned to this pro"
        );
      }
    }

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.ON_MY_WAY
    );
    if (!updated) {
      throw new Error("Failed to update booking status");
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await this.sendClientNotification(
      updated,
      "booking.on_my_way",
      "El profesional está en camino",
      `${pro?.displayName || "El profesional"} está en camino a tu ubicación para la reserva #${updated.id}.`,
      `<p><strong>${pro?.displayName || "El profesional"}</strong> está en camino a tu ubicación.</p><p>Reserva: <strong>#${updated.id}</strong></p>`
    );

    return updated;
  }

  /**
   * Mark booking as arrived (ON_MY_WAY -> ARRIVED)
   * Authorization: Pro assigned to booking or Admin
   */
  async arriveBooking(actor: Actor, bookingId: string): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.ARRIVED);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.PRO) {
        throw new UnauthorizedBookingActionError(
          "arrive booking",
          "Only pros can mark bookings as arrived"
        );
      }

      // Get pro profile for actor
      const proProfile = await this.proRepository.findByUserId(actor.id);
      if (!proProfile) {
        throw new UnauthorizedBookingActionError(
          "arrive booking",
          "Pro profile not found"
        );
      }

      if (booking.proProfileId !== proProfile.id) {
        throw new UnauthorizedBookingActionError(
          "arrive booking",
          "Booking is not assigned to this pro"
        );
      }
    }

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.ARRIVED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await this.sendClientNotification(
      updated,
      "booking.arrived",
      "El profesional llegó",
      `${pro?.displayName || "El profesional"} llegó a tu ubicación para la reserva #${updated.id}.`,
      `<p><strong>${pro?.displayName || "El profesional"}</strong> llegó a tu ubicación.</p><p>Reserva: <strong>#${updated.id}</strong></p>`
    );

    return updated;
  }

  /**
   * Cancel a booking (PENDING -> CANCELLED or ACCEPTED -> CANCELLED)
   * Authorization: Client who owns booking, or Admin
   */
  async cancelBooking(actor: Actor, bookingId: string): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.CANCELLED);

    // Authorization: Client must own booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.CLIENT) {
        throw new UnauthorizedBookingActionError(
          "cancel booking",
          "Only clients can cancel bookings"
        );
      }

      if (booking.clientUserId !== actor.id) {
        throw new UnauthorizedBookingActionError(
          "cancel booking",
          "Booking does not belong to this client"
        );
      }
    }

    // Update status
    const updated = await this.bookingRepository.updateStatus(
      bookingId,
      BookingStatus.CANCELLED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    return updated;
  }

  /**
   * Complete a booking (ARRIVED -> COMPLETED)
   * Authorization: Pro assigned to booking or Admin
   */
  async completeBooking(
    actor: Actor,
    bookingId: string
  ): Promise<BookingEntity> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Validate state transition
    this.validateStateTransition(booking.status, BookingStatus.COMPLETED);

    // Authorization: Pro must be assigned to booking, or actor must be admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.PRO) {
        throw new UnauthorizedBookingActionError(
          "complete booking",
          "Only pros can complete bookings"
        );
      }

      // Get pro profile for actor
      const proProfile = await this.proRepository.findByUserId(actor.id);
      if (!proProfile) {
        throw new UnauthorizedBookingActionError(
          "complete booking",
          "Pro profile not found"
        );
      }

      if (booking.proProfileId !== proProfile.id) {
        throw new UnauthorizedBookingActionError(
          "complete booking",
          "Booking is not assigned to this pro"
        );
      }
    }

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
        const paymentService = await this.paymentServiceFactory(payment.provider);
        
        // Attempt to capture payment (non-blocking - if it fails, booking still completes)
        // Payment can be captured manually later if needed
        await paymentService.capturePayment(payment.id).then(async () => {
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
        }).catch((error) => {
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
      console.error(`Error attempting to capture payment for booking ${bookingId}:`, error);
    }

    // Send notification to client
    const pro = await this.proRepository.findById(updated.proProfileId!);
    await this.sendClientNotification(
      updated,
      "booking.completed",
      "Tu reserva fue completada",
      `Tu reserva #${updated.id} fue completada por ${pro?.displayName || "el profesional"}. ¡Gracias por usar nuestro servicio!`,
      `<p>¡Tu reserva fue completada!</p><p>Reserva <strong>#${updated.id}</strong> completada por <strong>${pro?.displayName || "el profesional"}</strong>.</p><p>¡Gracias por usar nuestro servicio!</p>`
    );

    return updated;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) return null;
    
    // Get pro to get hourly rate
    const pro = booking.proProfileId
      ? await this.proRepository.findById(booking.proProfileId)
      : null;
    const hourlyRate = pro?.hourlyRate ?? 0;
    
    return this.mapBookingEntityToDomain(booking, hourlyRate);
  }

  /**
   * Get rebook template from a completed booking
   * Returns data needed to prefill a new booking form
   * Authorization: Caller must be the booking's client
   * Business rules:
   * - Booking status must be COMPLETED
   * - Booking must have proProfileId assigned
   */
  async getRebookTemplate(
    actor: Actor,
    bookingId: string
  ): Promise<{
    proProfileId: string;
    category: Category;
    addressText: string;
    estimatedHours: number;
  }> {
    const booking = await this.getBookingOrThrow(bookingId);

    // Authorization: Caller must be the booking's client
    if (actor.role !== Role.ADMIN) {
      if (actor.role !== Role.CLIENT) {
        throw new UnauthorizedBookingActionError(
          "get rebook template",
          "Only clients can rebook"
        );
      }

      if (booking.clientUserId !== actor.id) {
        throw new UnauthorizedBookingActionError(
          "get rebook template",
          "Booking does not belong to this client"
        );
      }
    }

    // Business rules: Booking must be COMPLETED
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new InvalidBookingStateError(
        booking.status,
        BookingStatus.COMPLETED
      );
    }

    // Business rules: Booking must have proProfileId
    if (!booking.proProfileId) {
      throw new Error("Booking does not have a pro assigned");
    }

    return {
      proProfileId: booking.proProfileId,
      category: booking.category as Category,
      addressText: booking.addressText,
      estimatedHours: booking.hoursEstimate,
    };
  }

  /**
   * Get bookings for a client
   */
  async getClientBookings(clientId: string): Promise<Booking[]> {
    const bookings = await this.bookingRepository.findByClientUserId(clientId);
    
    // Get pros for all bookings to get hourly rates
    const proIds = bookings
      .map((b) => b.proProfileId)
      .filter((id): id is string => id !== null);
    const pros = await Promise.all(
      proIds.map((id) => this.proRepository.findById(id))
    );
    const proMap = new Map(
      pros.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p.id, p.hourlyRate])
    );
    
    return bookings.map((booking) => {
      const hourlyRate = booking.proProfileId
        ? proMap.get(booking.proProfileId) ?? 0
        : 0;
      return this.mapBookingEntityToDomain(booking, hourlyRate);
    });
  }

  /**
   * Get bookings for a pro
   */
  async getProBookings(proId: string): Promise<Booking[]> {
    const bookings = await this.bookingRepository.findByProProfileId(proId);
    
    // Get pro to get hourly rate
    const pro = await this.proRepository.findById(proId);
    const hourlyRate = pro?.hourlyRate ?? 0;
    
    return bookings.map((booking) =>
      this.mapBookingEntityToDomain(booking, hourlyRate)
    );
  }

  /**
   * Get bookings for authenticated pro (by user ID)
   * Returns all bookings for the pro
   */
  async getProBookingsByUserId(userId: string): Promise<Booking[]> {
    // Get pro profile from user ID
    const proProfile = await this.proRepository.findByUserId(userId);
    if (!proProfile) {
      return [];
    }

    return this.getProBookings(proProfile.id);
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
  }): Promise<Array<{
    id: string;
    createdAt: Date;
    status: BookingStatus;
    clientEmail: string | null;
    clientName: string | null;
    proName: string | null;
    estimatedAmount: number;
    paymentStatus: string | null;
    currency: string;
  }>> {
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
      pros.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p.id, p])
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
      const pro = booking.proProfileId ? proMap.get(booking.proProfileId) : null;
      const payment = paymentMap.get(booking.id);
      const hourlyRate = pro?.hourlyRate ?? 0;
      const estimatedAmount = hourlyRate * booking.hoursEstimate;

      return {
        id: booking.id,
        createdAt: booking.createdAt,
        status: booking.status,
        clientEmail: clientProfile?.email ?? null,
        clientName: clientProfile
          ? `${clientProfile.firstName || ""} ${clientProfile.lastName || ""}`.trim() || null
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

    return this.mapBookingEntityToDomain(updated, hourlyRate);
  }

  /**
   * Send notification to client for a booking event
   * Always sends EMAIL if client has email
   * Sends WHATSAPP for important events if client has phone and prefers WhatsApp
   * Silently fails if notification fails (doesn't affect booking operation)
   */
  private async sendClientNotification(
    booking: BookingEntity,
    event: NotificationEvent,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    try {
      // Get client profile to get email and phone
      const clientProfile = await this.clientProfileService.getProfileByUserId(
        booking.clientUserId
      );

      // Only send if client has an email (email is always required)
      if (!clientProfile?.email) {
        return;
      }

      // Get pro info for notification content
      const pro = booking.proProfileId
        ? await this.proRepository.findById(booking.proProfileId)
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
      await this.notificationService.deliverNow(emailMessage).catch((error) => {
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
        await this.notificationService
          .deliverNow(whatsappMessage)
          .catch((error) => {
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
   * Validate state transition according to state machine rules:
   * PENDING -> ACCEPTED | REJECTED | CANCELLED
   * ACCEPTED -> ARRIVED | CANCELLED
   * ARRIVED -> COMPLETED
   */
  private validateStateTransition(
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
      [BookingStatus.ON_MY_WAY]: [
        BookingStatus.ARRIVED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.ARRIVED]: [
        BookingStatus.COMPLETED,
      ],
      [BookingStatus.REJECTED]: [], // Terminal state
      [BookingStatus.COMPLETED]: [], // Terminal state
      [BookingStatus.CANCELLED]: [], // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new InvalidBookingStateError(currentStatus, targetStatus);
    }
  }

  private adaptToDomain(
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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map BookingEntity to Booking domain type
   */
  private mapBookingEntityToDomain(
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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}


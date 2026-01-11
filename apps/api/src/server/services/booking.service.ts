import {
  bookingRepository,
  type BookingEntity,
} from "../repositories/booking.repo";
import { proRepository } from "../repositories/pro.repo";
import type {
  Booking,
  BookingCreateInput,
  BookingCreateOutput,
  Category,
} from "@repo/domain";
import { BookingStatus } from "@repo/domain";
import type { Actor } from "../auth/roles";
import { Role } from "@repo/domain";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
  BookingNotFoundError,
} from "../errors/booking.errors";

/**
 * Booking service
 * Contains business logic for booking operations including state machine
 * Note: Temporarily adapts between new repository entities and domain types for router compatibility
 */
export class BookingService {
  /**
   * Create a new booking
   * Business rules:
   * - Pro must exist and be active
   * - Set initial status to PENDING
   */
  async createBooking(
    actor: Actor,
    input: BookingCreateInput
  ): Promise<BookingCreateOutput> {
    // Validate pro exists
    const pro = await proRepository.findById(input.proId);
    if (!pro) {
      throw new Error("Pro not found");
    }

    if (pro.status === "suspended") {
      throw new Error("Pro is suspended");
    }

    // Create booking via repository
    const booking = await bookingRepository.create({
      clientUserId: actor.id,
      proProfileId: input.proId,
      category: input.category as string,
      scheduledAt: input.scheduledAt,
      hoursEstimate: input.estimatedHours,
      addressText: input.description,
    });

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
      const proProfile = await proRepository.findByUserId(actor.id);
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
    const updated = await bookingRepository.updateStatus(
      bookingId,
      BookingStatus.ACCEPTED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

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
      const proProfile = await proRepository.findByUserId(actor.id);
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
    const updated = await bookingRepository.updateStatus(
      bookingId,
      BookingStatus.REJECTED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    return updated;
  }

  /**
   * Mark booking as arrived (ACCEPTED -> ARRIVED)
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
      const proProfile = await proRepository.findByUserId(actor.id);
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
    const updated = await bookingRepository.updateStatus(
      bookingId,
      BookingStatus.ARRIVED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

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
    const updated = await bookingRepository.updateStatus(
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
      const proProfile = await proRepository.findByUserId(actor.id);
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
    const updated = await bookingRepository.updateStatus(
      bookingId,
      BookingStatus.COMPLETED
    );
    if (!updated) {
      throw new BookingNotFoundError(bookingId);
    }

    return updated;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking | null> {
    const booking = await bookingRepository.findById(id);
    if (!booking) return null;
    
    // Get pro to get hourly rate
    const pro = booking.proProfileId
      ? await proRepository.findById(booking.proProfileId)
      : null;
    const hourlyRate = pro?.hourlyRate ?? 0;
    
    return this.mapBookingEntityToDomain(booking, hourlyRate);
  }

  /**
   * Get bookings for a client
   */
  async getClientBookings(clientId: string): Promise<Booking[]> {
    const bookings = await bookingRepository.findByClientUserId(clientId);
    
    // Get pros for all bookings to get hourly rates
    const proIds = bookings
      .map((b) => b.proProfileId)
      .filter((id): id is string => id !== null);
    const pros = await Promise.all(
      proIds.map((id) => proRepository.findById(id))
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
    const bookings = await bookingRepository.findByProProfileId(proId);
    
    // Get pro to get hourly rate
    const pro = await proRepository.findById(proId);
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
    const proProfile = await proRepository.findByUserId(userId);
    if (!proProfile) {
      return [];
    }

    return this.getProBookings(proProfile.id);
  }

  /**
   * Get booking or throw error
   */
  private async getBookingOrThrow(bookingId: string): Promise<BookingEntity> {
    const booking = await bookingRepository.findById(bookingId);
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
      [BookingStatus.PENDING]: [
        BookingStatus.ACCEPTED,
        BookingStatus.REJECTED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.ACCEPTED]: [
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

export const bookingService = new BookingService();

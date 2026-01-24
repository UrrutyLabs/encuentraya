import { injectable, inject } from "tsyringe";
import type { BookingRepository } from "./booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { Booking, Category } from "@repo/domain";
import { BookingStatus, Role } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import {
  InvalidBookingStateError,
  UnauthorizedBookingActionError,
  BookingNotFoundError,
} from "./booking.errors";
import { mapBookingEntityToDomain } from "./booking.helpers";

/**
 * Booking query service
 * Handles all read operations (getById, list, search)
 */
@injectable()
export class BookingQueryService {
  constructor(
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
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

    return mapBookingEntityToDomain(booking, hourlyRate);
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
      pros
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.id, p.hourlyRate])
    );

    return bookings.map((booking) => {
      const hourlyRate = booking.proProfileId
        ? (proMap.get(booking.proProfileId) ?? 0)
        : 0;
      return mapBookingEntityToDomain(booking, hourlyRate);
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
      mapBookingEntityToDomain(booking, hourlyRate)
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
}

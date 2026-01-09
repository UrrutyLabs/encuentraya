import { prisma } from "../db/prisma";
import { BookingStatus } from "@repo/domain";

/**
 * Booking entity (plain object)
 */
export interface BookingEntity {
  id: string;
  clientUserId: string;
  proProfileId: string | null;
  status: BookingStatus;
  scheduledAt: Date;
  hoursEstimate: number;
  addressText: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking create input
 */
export interface BookingCreateInput {
  clientUserId: string;
  proProfileId?: string;
  scheduledAt: Date;
  hoursEstimate: number;
  addressText: string;
}

/**
 * Booking repository interface
 * Handles all data access for bookings
 */
export interface BookingRepository {
  create(input: BookingCreateInput): Promise<BookingEntity>;
  findById(id: string): Promise<BookingEntity | null>;
  findByClientUserId(clientUserId: string): Promise<BookingEntity[]>;
  findByProProfileId(proProfileId: string): Promise<BookingEntity[]>;
  updateStatus(
    id: string,
    status: BookingStatus
  ): Promise<BookingEntity | null>;
  updateProProfileId(
    id: string,
    proProfileId: string | null
  ): Promise<BookingEntity | null>;
  assignPro(id: string, proProfileId: string): Promise<BookingEntity | null>;
}

/**
 * Booking repository implementation using Prisma
 */
class BookingRepositoryImpl implements BookingRepository {
  async create(input: BookingCreateInput): Promise<BookingEntity> {
    const booking = await prisma.booking.create({
      data: {
        clientUserId: input.clientUserId,
        proProfileId: input.proProfileId ?? null,
        scheduledAt: input.scheduledAt,
        hoursEstimate: input.hoursEstimate,
        addressText: input.addressText,
        status: "pending",
      },
    });

    return this.mapPrismaToDomain(booking);
  }

  async findById(id: string): Promise<BookingEntity | null> {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    return booking ? this.mapPrismaToDomain(booking) : null;
  }

  async findByClientUserId(clientUserId: string): Promise<BookingEntity[]> {
    const bookings = await prisma.booking.findMany({
      where: { clientUserId },
      orderBy: { scheduledAt: "desc" },
    });

    return bookings.map(this.mapPrismaToDomain);
  }

  async findByProProfileId(proProfileId: string): Promise<BookingEntity[]> {
    const bookings = await prisma.booking.findMany({
      where: { proProfileId },
      orderBy: { scheduledAt: "desc" },
    });

    return bookings.map(this.mapPrismaToDomain);
  }

  async updateStatus(
    id: string,
    status: BookingStatus
  ): Promise<BookingEntity | null> {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return this.mapPrismaToDomain(booking);
  }

  async updateProProfileId(
    id: string,
    proProfileId: string | null
  ): Promise<BookingEntity | null> {
    const booking = await prisma.booking.update({
      where: { id },
      data: { proProfileId },
    });

    return this.mapPrismaToDomain(booking);
  }

  async assignPro(
    id: string,
    proProfileId: string
  ): Promise<BookingEntity | null> {
    const booking = await prisma.booking.update({
      where: { id },
      data: { proProfileId },
    });

    return this.mapPrismaToDomain(booking);
  }

  private mapPrismaToDomain(prismaBooking: {
    id: string;
    clientUserId: string;
    proProfileId: string | null;
    status: string;
    scheduledAt: Date;
    hoursEstimate: number;
    addressText: string;
    createdAt: Date;
    updatedAt: Date;
  }): BookingEntity {
    return {
      id: prismaBooking.id,
      clientUserId: prismaBooking.clientUserId,
      proProfileId: prismaBooking.proProfileId,
      status: prismaBooking.status as BookingStatus,
      scheduledAt: prismaBooking.scheduledAt,
      hoursEstimate: prismaBooking.hoursEstimate,
      addressText: prismaBooking.addressText,
      createdAt: prismaBooking.createdAt,
      updatedAt: prismaBooking.updatedAt,
    };
  }
}

export const bookingRepository: BookingRepository = new BookingRepositoryImpl();

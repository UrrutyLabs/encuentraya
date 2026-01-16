import { injectable } from "tsyringe";
import { $Enums, Prisma } from "@infra/db/prisma";
import { prisma } from "@infra/db/prisma";
import { BookingStatus } from "@repo/domain";
import { getNextDisplayId } from "./booking.display-id";

/**
 * Booking entity (plain object)
 */
export interface BookingEntity {
  id: string;
  displayId: string;
  clientUserId: string;
  proProfileId: string | null;
  category: string; // Category enum value
  status: BookingStatus;
  scheduledAt: Date;
  hoursEstimate: number;
  addressText: string;
  isFirstBooking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking create input
 */
export interface BookingCreateInput {
  clientUserId: string;
  proProfileId?: string;
  category: string; // Category enum value
  scheduledAt: Date;
  hoursEstimate: number;
  addressText: string;
  isFirstBooking?: boolean;
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
  findAll(filters?: {
    status?: BookingStatus;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    cursor?: string;
  }): Promise<BookingEntity[]>;
  updateStatus(
    id: string,
    status: BookingStatus
  ): Promise<BookingEntity | null>;
  updateProProfileId(
    id: string,
    proProfileId: string | null
  ): Promise<BookingEntity | null>;
  assignPro(id: string, proProfileId: string): Promise<BookingEntity | null>;
  findActiveByClientUserId(clientUserId: string): Promise<BookingEntity[]>;
}

/**
 * Booking repository implementation using Prisma
 */
@injectable()
export class BookingRepositoryImpl implements BookingRepository {
  async create(input: BookingCreateInput): Promise<BookingEntity> {
    // Generate displayId before creating
    const displayId = await getNextDisplayId();

    const booking = await prisma.booking.create({
      data: {
        displayId,
        clientUserId: input.clientUserId,
        proProfileId: input.proProfileId ?? null,
        category: input.category as $Enums.Category, // Prisma expects Category enum, but we pass string
        scheduledAt: input.scheduledAt,
        hoursEstimate: input.hoursEstimate,
        addressText: input.addressText,
        isFirstBooking: input.isFirstBooking ?? false,
        status: BookingStatus.PENDING_PAYMENT  as $Enums.BookingStatus,
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

  async findAll(filters?: {
    status?: BookingStatus;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    cursor?: string;
  }): Promise<BookingEntity[]> {
    const where: Prisma.BookingWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as $Enums.BookingStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledAt = {};
      if (filters.dateFrom) {
        where.scheduledAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.scheduledAt.lte = filters.dateTo;
      }
    }

    if (filters?.cursor) {
      where.id = { gt: filters.cursor };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 100,
    });

    return bookings.map(this.mapPrismaToDomain);
  }

  async updateStatus(
    id: string,
    status: BookingStatus
  ): Promise<BookingEntity | null> {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: status as $Enums.BookingStatus }, // Type assertion needed until Prisma client is regenerated
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

  async findActiveByClientUserId(clientUserId: string): Promise<BookingEntity[]> {
    const activeStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.ACCEPTED,
      BookingStatus.ON_MY_WAY,
      BookingStatus.ARRIVED,
    ];

    const bookings = await prisma.booking.findMany({
      where: {
        clientUserId,
        status: {
          in: activeStatuses as $Enums.BookingStatus[],
        },
      },
    });

    return bookings.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(prismaBooking: {
    id: string;
    displayId: string;
    clientUserId: string;
    proProfileId: string | null;
    category: string;
    status: string;
    scheduledAt: Date;
    hoursEstimate: number;
    addressText: string;
    isFirstBooking: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BookingEntity {
    return {
      id: prismaBooking.id,
      displayId: prismaBooking.displayId,
      clientUserId: prismaBooking.clientUserId,
      proProfileId: prismaBooking.proProfileId,
      category: prismaBooking.category,
      status: prismaBooking.status as BookingStatus,
      scheduledAt: prismaBooking.scheduledAt,
      hoursEstimate: prismaBooking.hoursEstimate,
      addressText: prismaBooking.addressText,
      isFirstBooking: prismaBooking.isFirstBooking,
      createdAt: prismaBooking.createdAt,
      updatedAt: prismaBooking.updatedAt,
    };
  }
}

export const bookingRepository: BookingRepository = new BookingRepositoryImpl();

import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * Review entity (plain object)
 */
export interface ReviewEntity {
  id: string;
  bookingId: string;
  proProfileId: string;
  clientUserId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: Date;
}

/**
 * Review create input
 */
export interface ReviewCreateInput {
  bookingId: string;
  proProfileId: string;
  clientUserId: string;
  rating: number;
  comment?: string;
}

/**
 * Review repository interface
 * Handles all data access for reviews
 */
export interface ReviewRepository {
  create(input: ReviewCreateInput): Promise<ReviewEntity>;
  findById(id: string): Promise<ReviewEntity | null>;
  findByBookingId(bookingId: string): Promise<ReviewEntity | null>;
  findByBookingIds(bookingIds: string[]): Promise<ReviewEntity[]>;
  findByProProfileId(proProfileId: string): Promise<ReviewEntity[]>;
  listForPro(
    proProfileId: string,
    limit?: number,
    cursor?: string
  ): Promise<ReviewEntity[]>;
}

/**
 * Review repository implementation using Prisma
 */
@injectable()
export class ReviewRepositoryImpl implements ReviewRepository {
  async create(input: ReviewCreateInput): Promise<ReviewEntity> {
    const review = await prisma.review.create({
      data: {
        bookingId: input.bookingId,
        proProfileId: input.proProfileId,
        clientUserId: input.clientUserId,
        rating: input.rating,
        comment: input.comment,
      },
    });

    return this.mapPrismaToDomain(review);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    return review ? this.mapPrismaToDomain(review) : null;
  }

  async findByBookingId(bookingId: string): Promise<ReviewEntity | null> {
    const review = await prisma.review.findUnique({
      where: { bookingId },
    });

    return review ? this.mapPrismaToDomain(review) : null;
  }

  async findByBookingIds(bookingIds: string[]): Promise<ReviewEntity[]> {
    if (bookingIds.length === 0) {
      return [];
    }

    const reviews = await prisma.review.findMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
    });

    return reviews.map(this.mapPrismaToDomain);
  }

  async findByProProfileId(proProfileId: string): Promise<ReviewEntity[]> {
    // Get all bookings for this pro, then get their reviews
    const bookings = await prisma.booking.findMany({
      where: { proProfileId },
      select: { id: true },
    });

    const bookingIds = bookings.map((booking) => booking.id);

    const reviews = await prisma.review.findMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews.map(this.mapPrismaToDomain);
  }

  async listForPro(
    proProfileId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<ReviewEntity[]> {
    const reviews = await prisma.review.findMany({
      where: {
        proProfileId,
        ...(cursor && {
          id: {
            gt: cursor,
          },
        }),
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return reviews.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(prismaReview: {
    id: string;
    bookingId: string;
    proProfileId: string;
    clientUserId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }): ReviewEntity {
    return {
      id: prismaReview.id,
      bookingId: prismaReview.bookingId,
      proProfileId: prismaReview.proProfileId,
      clientUserId: prismaReview.clientUserId,
      rating: prismaReview.rating,
      comment: prismaReview.comment,
      createdAt: prismaReview.createdAt,
    };
  }
}

export const reviewRepository: ReviewRepository = new ReviewRepositoryImpl();

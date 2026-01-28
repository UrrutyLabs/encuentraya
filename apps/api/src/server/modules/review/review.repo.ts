import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * Review entity (plain object)
 */
export interface ReviewEntity {
  id: string;
  orderId: string;
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
  orderId: string;
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
  findByOrderId(orderId: string): Promise<ReviewEntity | null>;
  findByOrderIds(orderIds: string[]): Promise<ReviewEntity[]>;
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
        orderId: input.orderId,
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

  async findByOrderId(orderId: string): Promise<ReviewEntity | null> {
    const review = await prisma.review.findUnique({
      where: { orderId },
    });

    return review ? this.mapPrismaToDomain(review) : null;
  }

  async findByOrderIds(orderIds: string[]): Promise<ReviewEntity[]> {
    if (orderIds.length === 0) {
      return [];
    }

    const reviews = await prisma.review.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
    });

    return reviews.map(this.mapPrismaToDomain);
  }

  async findByProProfileId(proProfileId: string): Promise<ReviewEntity[]> {
    // Query reviews directly by proProfileId (indexed field)
    const reviews = await prisma.review.findMany({
      where: {
        proProfileId,
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
    orderId: string;
    proProfileId: string;
    clientUserId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }): ReviewEntity {
    return {
      id: prismaReview.id,
      orderId: prismaReview.orderId,
      proProfileId: prismaReview.proProfileId,
      clientUserId: prismaReview.clientUserId,
      rating: prismaReview.rating,
      comment: prismaReview.comment,
      createdAt: prismaReview.createdAt,
    };
  }
}

export const reviewRepository: ReviewRepository = new ReviewRepositoryImpl();

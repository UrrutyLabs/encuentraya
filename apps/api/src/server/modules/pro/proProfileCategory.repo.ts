import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * Per-category rate input for bulk create
 */
export interface CategoryRateItem {
  categoryId: string;
  hourlyRateCents?: number;
  startingFromCents?: number;
}

/**
 * ProProfileCategory entity (junction table)
 */
export interface ProProfileCategoryEntity {
  id: string;
  proProfileId: string;
  categoryId: string;
  hourlyRateCents: number | null;
  startingFromCents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProProfileCategory repository interface
 * Handles all data access for pro-category relationships
 */
export interface ProProfileCategoryRepository {
  findByProProfileId(proProfileId: string): Promise<ProProfileCategoryEntity[]>;
  findByCategoryId(categoryId: string): Promise<ProProfileCategoryEntity[]>;
  findByProProfileAndCategory(
    proProfileId: string,
    categoryId: string
  ): Promise<ProProfileCategoryEntity | null>;
  create(
    proProfileId: string,
    categoryId: string,
    rates?: { hourlyRateCents?: number; startingFromCents?: number }
  ): Promise<ProProfileCategoryEntity>;
  delete(proProfileId: string, categoryId: string): Promise<void>;
  deleteByProProfileId(proProfileId: string): Promise<void>;
  bulkCreate(
    proProfileId: string,
    items: (string | CategoryRateItem)[]
  ): Promise<ProProfileCategoryEntity[]>;
  bulkDelete(proProfileId: string, categoryIds: string[]): Promise<void>;
}

/**
 * ProProfileCategory repository implementation using Prisma
 */
@injectable()
export class ProProfileCategoryRepositoryImpl implements ProProfileCategoryRepository {
  async findByProProfileId(
    proProfileId: string
  ): Promise<ProProfileCategoryEntity[]> {
    const relations = await prisma.proProfileCategory.findMany({
      where: {
        proProfileId,
        category: {
          deletedAt: null, // Filter out soft-deleted categories
        },
      },
      include: {
        category: true, // Include category for filtering
      },
    });

    return relations.map(this.mapPrismaToDomain);
  }

  async findByCategoryId(
    categoryId: string
  ): Promise<ProProfileCategoryEntity[]> {
    const relations = await prisma.proProfileCategory.findMany({
      where: {
        categoryId,
        category: {
          deletedAt: null, // Filter out soft-deleted categories
        },
      },
    });

    return relations.map(this.mapPrismaToDomain);
  }

  async findByProProfileAndCategory(
    proProfileId: string,
    categoryId: string
  ): Promise<ProProfileCategoryEntity | null> {
    const relation = await prisma.proProfileCategory.findUnique({
      where: {
        proProfileId_categoryId: {
          proProfileId,
          categoryId,
        },
      },
    });

    return relation ? this.mapPrismaToDomain(relation) : null;
  }

  async create(
    proProfileId: string,
    categoryId: string,
    rates?: { hourlyRateCents?: number; startingFromCents?: number }
  ): Promise<ProProfileCategoryEntity> {
    const relation = await prisma.proProfileCategory.create({
      data: {
        proProfileId,
        categoryId,
        hourlyRateCents: rates?.hourlyRateCents ?? null,
        startingFromCents: rates?.startingFromCents ?? null,
      },
    });

    return this.mapPrismaToDomain(relation);
  }

  async delete(proProfileId: string, categoryId: string): Promise<void> {
    await prisma.proProfileCategory.delete({
      where: {
        proProfileId_categoryId: {
          proProfileId,
          categoryId,
        },
      },
    });
  }

  async deleteByProProfileId(proProfileId: string): Promise<void> {
    await prisma.proProfileCategory.deleteMany({
      where: {
        proProfileId,
      },
    });
  }

  async bulkCreate(
    proProfileId: string,
    items: (string | CategoryRateItem)[]
  ): Promise<ProProfileCategoryEntity[]> {
    if (items.length === 0) {
      return [];
    }

    const data = items.map((item) => {
      if (typeof item === "string") {
        return {
          proProfileId,
          categoryId: item,
          hourlyRateCents: null,
          startingFromCents: null,
        };
      }
      return {
        proProfileId,
        categoryId: item.categoryId,
        hourlyRateCents: item.hourlyRateCents ?? null,
        startingFromCents: item.startingFromCents ?? null,
      };
    });

    await prisma.proProfileCategory.createMany({
      data,
      skipDuplicates: true,
    });

    const categoryIds = items.map((item) =>
      typeof item === "string" ? item : item.categoryId
    );
    const relations = await prisma.proProfileCategory.findMany({
      where: {
        proProfileId,
        categoryId: { in: categoryIds },
      },
    });

    return relations.map(this.mapPrismaToDomain);
  }

  async bulkDelete(proProfileId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    await prisma.proProfileCategory.deleteMany({
      where: {
        proProfileId,
        categoryId: {
          in: categoryIds,
        },
      },
    });
  }

  private mapPrismaToDomain(prismaRelation: {
    id: string;
    proProfileId: string;
    categoryId: string;
    hourlyRateCents: number | null;
    startingFromCents: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProProfileCategoryEntity {
    return {
      id: prismaRelation.id,
      proProfileId: prismaRelation.proProfileId,
      categoryId: prismaRelation.categoryId,
      hourlyRateCents: prismaRelation.hourlyRateCents ?? null,
      startingFromCents: prismaRelation.startingFromCents ?? null,
      createdAt: prismaRelation.createdAt,
      updatedAt: prismaRelation.updatedAt,
    };
  }
}

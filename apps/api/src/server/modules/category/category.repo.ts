import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@repo/domain";
import { Prisma } from "@infra/db/prisma";

/**
 * Category repository interface
 * Handles all data access for Category table (data-driven categories)
 */
export interface CategoryRepository {
  findById(id: string, includeDeleted?: boolean): Promise<Category | null>;
  findByKey(key: string, includeDeleted?: boolean): Promise<Category | null>;
  findBySlug(slug: string, includeDeleted?: boolean): Promise<Category | null>;
  findAll(includeDeleted?: boolean): Promise<Category[]>;
  create(input: CategoryCreateInput): Promise<Category>;
  update(id: string, input: CategoryUpdateInput): Promise<Category | null>;
  softDelete(id: string): Promise<Category | null>;
  restore(id: string): Promise<Category | null>;
}

/**
 * Category repository implementation using Prisma
 */
@injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  async findById(id: string, includeDeleted = false): Promise<Category | null> {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return null;
    }

    // Filter out soft-deleted unless explicitly included
    if (!includeDeleted && category.deletedAt) {
      return null;
    }

    return this.mapPrismaToDomain(category);
  }

  async findByKey(
    key: string,
    includeDeleted = false
  ): Promise<Category | null> {
    // For active categories, use the partial unique index
    // For soft-deleted, we need to query differently
    const category = await prisma.category.findFirst({
      where: {
        key,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: "desc" }, // Get most recent if multiple soft-deleted exist
    });

    if (!category) {
      return null;
    }

    return this.mapPrismaToDomain(category);
  }

  async findBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<Category | null> {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!category) {
      return null;
    }

    return this.mapPrismaToDomain(category);
  }

  async findAll(includeDeleted = false): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    });

    return categories.map(this.mapPrismaToDomain);
  }

  async create(input: CategoryCreateInput): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        key: input.key,
        name: input.name,
        slug: input.slug,
        iconName: input.iconName ?? null,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        configJson: input.configJson
          ? (input.configJson as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return this.mapPrismaToDomain(category);
  }

  async update(
    id: string,
    input: CategoryUpdateInput
  ): Promise<Category | null> {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        iconName: input.iconName ?? undefined,
        description: input.description ?? undefined,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        configJson: input.configJson
          ? (input.configJson as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return this.mapPrismaToDomain(category);
  }

  async softDelete(id: string): Promise<Category | null> {
    const category = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.mapPrismaToDomain(category);
  }

  async restore(id: string): Promise<Category | null> {
    const category = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });

    return this.mapPrismaToDomain(category);
  }

  private mapPrismaToDomain(prismaCategory: {
    id: string;
    key: string;
    name: string;
    slug: string;
    iconName: string | null;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    deletedAt: Date | null;
    configJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    return {
      id: prismaCategory.id,
      key: prismaCategory.key,
      name: prismaCategory.name,
      slug: prismaCategory.slug,
      iconName: prismaCategory.iconName,
      description: prismaCategory.description,
      sortOrder: prismaCategory.sortOrder,
      isActive: prismaCategory.isActive,
      deletedAt: prismaCategory.deletedAt,
      configJson: prismaCategory.configJson as Record<string, unknown> | null,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    };
  }
}

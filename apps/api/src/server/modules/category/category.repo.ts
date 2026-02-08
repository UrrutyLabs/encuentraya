import { randomUUID } from "node:crypto";
import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@repo/domain";
import { PricingMode, PaymentStrategy } from "@repo/domain";
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
      where: includeDeleted ? {} : { deletedAt: null, isActive: true },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
    });

    return categories.map(this.mapPrismaToDomain);
  }

  async create(input: CategoryCreateInput): Promise<Category> {
    const id = randomUUID();
    const configJson =
      input.configJson != null ? JSON.stringify(input.configJson) : null;
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        key: string;
        name: string;
        slug: string;
        iconName: string | null;
        description: string | null;
        sortOrder: number;
        pricingMode: string;
        paymentStrategy: string;
        isActive: boolean;
        deletedAt: Date | null;
        configJson: unknown;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `INSERT INTO categories (id, key, name, slug, "iconName", description, "sortOrder", "pricingMode", "paymentStrategy", "isActive", "configJson")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
       RETURNING id, key, name, slug, "iconName", description, "sortOrder", "pricingMode", "paymentStrategy", "isActive", "deletedAt", "configJson", "createdAt", "updatedAt"`,
      id,
      input.key,
      input.name,
      input.slug,
      input.iconName ?? null,
      input.description ?? null,
      input.sortOrder ?? 0,
      input.pricingMode ?? "hourly",
      input.paymentStrategy ?? "single_capture",
      input.isActive ?? true,
      configJson
    );
    const row = rows[0];
    if (!row) throw new Error("Category create failed: no row returned");
    return this.mapPrismaToDomain(row);
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
        pricingMode: input.pricingMode as "hourly" | "fixed" | undefined,
        paymentStrategy: input.paymentStrategy as "single_capture" | undefined,
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
    pricingMode?: string;
    paymentStrategy?: string;
    isActive: boolean;
    deletedAt: Date | null;
    configJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    const cat = prismaCategory as typeof prismaCategory & {
      pricingMode?: string;
      paymentStrategy?: string;
    };
    return {
      id: cat.id,
      key: cat.key,
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName,
      description: cat.description,
      sortOrder: cat.sortOrder,
      pricingMode: (cat.pricingMode ?? "hourly") as PricingMode,
      paymentStrategy: (cat.paymentStrategy ??
        "single_capture") as PaymentStrategy,
      isActive: cat.isActive,
      deletedAt: cat.deletedAt,
      configJson: cat.configJson as Record<string, unknown> | null,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }
}

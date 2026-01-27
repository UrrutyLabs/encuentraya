import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Category } from "@repo/domain";

/**
 * Subcategory entity (plain object)
 */
export interface SubcategoryEntity {
  id: string;
  name: string;
  slug: string;
  category: Category;
  imageUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subcategory create input
 */
export interface SubcategoryCreateInput {
  name: string;
  slug: string;
  category: Category;
  imageUrl?: string | null;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Subcategory repository interface
 * Handles all data access for subcategories
 */
export interface SubcategoryRepository {
  findById(id: string): Promise<SubcategoryEntity | null>;
  findBySlug(
    slug: string,
    category: Category
  ): Promise<SubcategoryEntity | null>;
  findByCategory(category: Category): Promise<SubcategoryEntity[]>;
  findAll(): Promise<SubcategoryEntity[]>;
  create(input: SubcategoryCreateInput): Promise<SubcategoryEntity>;
  update(
    id: string,
    data: Partial<SubcategoryCreateInput>
  ): Promise<SubcategoryEntity | null>;
}

/**
 * Subcategory repository implementation using Prisma
 */
@injectable()
export class SubcategoryRepositoryImpl implements SubcategoryRepository {
  async findById(id: string): Promise<SubcategoryEntity | null> {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
    });

    if (!subcategory) {
      return null;
    }

    return this.mapPrismaToDomain(
      subcategory as Parameters<typeof this.mapPrismaToDomain>[0]
    );
  }

  async findBySlug(
    slug: string,
    category: Category
  ): Promise<SubcategoryEntity | null> {
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        slug_category: {
          slug,
          category,
        },
      },
    });

    if (!subcategory) {
      return null;
    }

    return this.mapPrismaToDomain(
      subcategory as Parameters<typeof this.mapPrismaToDomain>[0]
    );
  }

  async findByCategory(category: Category): Promise<SubcategoryEntity[]> {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return subcategories.map((s) =>
      this.mapPrismaToDomain(s as Parameters<typeof this.mapPrismaToDomain>[0])
    );
  }

  async findAll(): Promise<SubcategoryEntity[]> {
    const subcategories = await prisma.subcategory.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });

    return subcategories.map((s) =>
      this.mapPrismaToDomain(s as Parameters<typeof this.mapPrismaToDomain>[0])
    );
  }

  async create(input: SubcategoryCreateInput): Promise<SubcategoryEntity> {
    const subcategory = await prisma.subcategory.create({
      data: {
        name: input.name,
        slug: input.slug,
        category: input.category,
        imageUrl: input.imageUrl ?? null,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });

    return this.mapPrismaToDomain(
      subcategory as Parameters<typeof this.mapPrismaToDomain>[0]
    );
  }

  async update(
    id: string,
    data: Partial<SubcategoryCreateInput>
  ): Promise<SubcategoryEntity | null> {
    const updated = await prisma.subcategory.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        category: data.category,
        imageUrl: data.imageUrl ?? undefined,
        description: data.description ?? undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });

    return this.mapPrismaToDomain(
      updated as Parameters<typeof this.mapPrismaToDomain>[0]
    );
  }

  private mapPrismaToDomain(prismaSubcategory: {
    id: string;
    name: string;
    slug: string;
    category: string; // Prisma Category enum (compatible with domain Category)
    imageUrl: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SubcategoryEntity {
    return {
      id: prismaSubcategory.id,
      name: prismaSubcategory.name,
      slug: prismaSubcategory.slug,
      category: prismaSubcategory.category as Category,
      imageUrl: prismaSubcategory.imageUrl,
      description: prismaSubcategory.description,
      displayOrder: prismaSubcategory.displayOrder,
      isActive: prismaSubcategory.isActive,
      createdAt: prismaSubcategory.createdAt,
      updatedAt: prismaSubcategory.updatedAt,
    };
  }
}

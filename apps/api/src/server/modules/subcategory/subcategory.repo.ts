import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * Subcategory entity (plain object)
 */
export interface SubcategoryEntity {
  id: string;
  name: string;
  slug: string;
  categoryId: string; // FK to Category table (required)
  key: string | null; // Stable identifier within category
  imageUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  configJson: Record<string, unknown> | null; // Subcategory-level config
  searchKeywords: string[]; // Search keywords
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subcategory create input
 */
export interface SubcategoryCreateInput {
  name: string;
  slug: string;
  categoryId: string; // FK to Category table (required)
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
  findBySlugAndCategoryId(
    slug: string,
    categoryId: string
  ): Promise<SubcategoryEntity | null>;
  findByCategoryId(categoryId: string): Promise<SubcategoryEntity[]>;
  findAll(): Promise<SubcategoryEntity[]>;
  create(input: SubcategoryCreateInput): Promise<SubcategoryEntity>;
  update(
    id: string,
    data: Partial<SubcategoryCreateInput>
  ): Promise<SubcategoryEntity | null>;
  delete(id: string): Promise<void>;
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

    return this.mapPrismaToDomain(subcategory);
  }

  async findBySlugAndCategoryId(
    slug: string,
    categoryId: string
  ): Promise<SubcategoryEntity | null> {
    const subcategory = await prisma.subcategory.findFirst({
      where: {
        slug,
        categoryId,
        isActive: true,
      },
    });

    if (!subcategory) {
      return null;
    }

    return this.mapPrismaToDomain(subcategory);
  }

  async findByCategoryId(categoryId: string): Promise<SubcategoryEntity[]> {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return subcategories.map((s) => this.mapPrismaToDomain(s));
  }

  async findAll(): Promise<SubcategoryEntity[]> {
    const subcategories = await prisma.subcategory.findMany({
      where: { isActive: true },
      orderBy: [{ categoryId: "asc" }, { displayOrder: "asc" }],
    });

    return subcategories.map((s) => this.mapPrismaToDomain(s));
  }

  async create(input: SubcategoryCreateInput): Promise<SubcategoryEntity> {
    const subcategory = await prisma.subcategory.create({
      data: {
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        imageUrl: input.imageUrl ?? null,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });

    return this.mapPrismaToDomain(subcategory);
  }

  async update(
    id: string,
    data: Partial<SubcategoryCreateInput>
  ): Promise<SubcategoryEntity | null> {
    const updateData: {
      name?: string;
      slug?: string;
      categoryId?: string;
      imageUrl?: string | null;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.imageUrl !== undefined)
      updateData.imageUrl = data.imageUrl ?? null;
    if (data.description !== undefined)
      updateData.description = data.description ?? null;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.subcategory.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.subcategory.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma subcategory to domain entity
   */
  private mapPrismaToDomain(prismaSubcategory: {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    key: string | null;
    imageUrl: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    configJson: unknown;
    searchKeywords: string[];
    createdAt: Date;
    updatedAt: Date;
  }): SubcategoryEntity {
    if (!prismaSubcategory.categoryId) {
      throw new Error(
        `Subcategory ${prismaSubcategory.id} has null categoryId`
      );
    }
    return {
      id: prismaSubcategory.id,
      name: prismaSubcategory.name,
      slug: prismaSubcategory.slug,
      categoryId: prismaSubcategory.categoryId,
      key: prismaSubcategory.key,
      imageUrl: prismaSubcategory.imageUrl,
      description: prismaSubcategory.description,
      displayOrder: prismaSubcategory.displayOrder,
      isActive: prismaSubcategory.isActive,
      configJson: prismaSubcategory.configJson as Record<
        string,
        unknown
      > | null,
      searchKeywords: prismaSubcategory.searchKeywords,
      createdAt: prismaSubcategory.createdAt,
      updatedAt: prismaSubcategory.updatedAt,
    };
  }
}

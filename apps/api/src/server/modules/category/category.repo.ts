import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Category } from "@repo/domain";

/**
 * CategoryMetadata entity (plain object)
 */
export interface CategoryMetadataEntity {
  id: string;
  category: Category;
  displayName: string;
  iconName: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CategoryMetadata repository interface
 * Handles all data access for category metadata
 */
export interface CategoryMetadataRepository {
  findByCategory(category: Category): Promise<CategoryMetadataEntity | null>;
  findAll(): Promise<CategoryMetadataEntity[]>;
  update(
    category: Category,
    data: Partial<Omit<CategoryMetadataEntity, "id" | "category" | "createdAt">>
  ): Promise<CategoryMetadataEntity | null>;
}

/**
 * CategoryMetadata repository implementation using Prisma
 */
@injectable()
export class CategoryMetadataRepositoryImpl implements CategoryMetadataRepository {
  async findByCategory(
    category: Category
  ): Promise<CategoryMetadataEntity | null> {
    const metadata = await prisma.categoryMetadata.findUnique({
      where: { category },
    });

    if (!metadata) {
      return null;
    }

    return this.mapPrismaToDomain(metadata);
  }

  async findAll(): Promise<CategoryMetadataEntity[]> {
    const metadataList = await prisma.categoryMetadata.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    return metadataList.map(this.mapPrismaToDomain);
  }

  async update(
    category: Category,
    data: Partial<Omit<CategoryMetadataEntity, "id" | "category" | "createdAt">>
  ): Promise<CategoryMetadataEntity | null> {
    const updated = await prisma.categoryMetadata.update({
      where: { category },
      data: {
        displayName: data.displayName,
        iconName: data.iconName ?? undefined,
        description: data.description ?? undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive ?? undefined,
      },
    });

    return this.mapPrismaToDomain(updated);
  }

  private mapPrismaToDomain(prismaMetadata: {
    id: string;
    category: Category;
    displayName: string;
    iconName: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CategoryMetadataEntity {
    return {
      id: prismaMetadata.id,
      category: prismaMetadata.category as Category,
      displayName: prismaMetadata.displayName,
      iconName: prismaMetadata.iconName,
      description: prismaMetadata.description,
      displayOrder: prismaMetadata.displayOrder,
      isActive: prismaMetadata.isActive,
      createdAt: prismaMetadata.createdAt,
      updatedAt: prismaMetadata.updatedAt,
    };
  }
}

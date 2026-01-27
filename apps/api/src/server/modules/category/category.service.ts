import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { CategoryMetadataRepository } from "./category.repo";
import type { CategoryMetadata } from "@repo/domain";
import { Category } from "@repo/domain";

/**
 * Category service
 * Contains business logic for category metadata
 */
@injectable()
export class CategoryService {
  constructor(
    @inject(TOKENS.CategoryMetadataRepository)
    private readonly categoryMetadataRepository: CategoryMetadataRepository
  ) {}

  /**
   * Get metadata for a specific category
   */
  async getCategoryMetadata(
    category: Category
  ): Promise<CategoryMetadata | null> {
    const entity =
      await this.categoryMetadataRepository.findByCategory(category);

    if (!entity) {
      return null;
    }

    return this.mapEntityToDomain(entity);
  }

  /**
   * Get metadata for all categories
   */
  async getAllCategoriesMetadata(): Promise<CategoryMetadata[]> {
    const entities = await this.categoryMetadataRepository.findAll();
    return entities.map(this.mapEntityToDomain);
  }

  private mapEntityToDomain(entity: {
    id: string;
    category: Category;
    displayName: string;
    iconName: string | null;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CategoryMetadata {
    return {
      id: entity.id,
      category: entity.category,
      displayName: entity.displayName,
      iconName: entity.iconName,
      description: entity.description,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

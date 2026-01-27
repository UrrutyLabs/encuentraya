import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { SubcategoryRepository } from "./subcategory.repo";
import type { Subcategory } from "@repo/domain";
import { Category } from "@repo/domain";

/**
 * Subcategory service
 * Contains business logic for subcategories
 */
@injectable()
export class SubcategoryService {
  constructor(
    @inject(TOKENS.SubcategoryRepository)
    private readonly subcategoryRepository: SubcategoryRepository
  ) {}

  /**
   * Get subcategories by category
   */
  async getSubcategoriesByCategory(category: Category): Promise<Subcategory[]> {
    const entities = await this.subcategoryRepository.findByCategory(category);
    return entities.map(this.mapEntityToDomain);
  }

  /**
   * Get subcategory by ID
   */
  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const entity = await this.subcategoryRepository.findById(id);
    if (!entity) {
      return null;
    }
    return this.mapEntityToDomain(entity);
  }

  /**
   * Get subcategory by slug and category
   */
  async getSubcategoryBySlug(
    slug: string,
    category: Category
  ): Promise<Subcategory | null> {
    const entity = await this.subcategoryRepository.findBySlug(slug, category);
    if (!entity) {
      return null;
    }
    return this.mapEntityToDomain(entity);
  }

  /**
   * Get all subcategories
   */
  async getAllSubcategories(): Promise<Subcategory[]> {
    const entities = await this.subcategoryRepository.findAll();
    return entities.map(this.mapEntityToDomain);
  }

  private mapEntityToDomain(entity: {
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
  }): Subcategory {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      category: entity.category,
      imageUrl: entity.imageUrl,
      description: entity.description,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type {
  SubcategoryRepository,
  SubcategoryEntity,
} from "./subcategory.repo";
import type { Subcategory } from "@repo/domain";

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
   * Get subcategories by categoryId
   */
  async getSubcategoriesByCategoryId(
    categoryId: string
  ): Promise<Subcategory[]> {
    const entities =
      await this.subcategoryRepository.findByCategoryId(categoryId);
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
   * Get subcategory by slug and categoryId
   */
  async getSubcategoryBySlugAndCategoryId(
    slug: string,
    categoryId: string
  ): Promise<Subcategory | null> {
    const entity = await this.subcategoryRepository.findBySlugAndCategoryId(
      slug,
      categoryId
    );
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

  /**
   * Create a new subcategory
   */
  async createSubcategory(input: {
    name: string;
    slug: string;
    categoryId: string;
    imageUrl?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
    configJson?: Record<string, unknown> | null;
    searchKeywords?: string[];
  }): Promise<Subcategory> {
    // Check if subcategory with same slug already exists in this category
    const existing = await this.subcategoryRepository.findBySlugAndCategoryId(
      input.slug,
      input.categoryId
    );

    if (existing) {
      throw new Error(
        `Subcategory with slug "${input.slug}" already exists in this category`
      );
    }

    const entity = await this.subcategoryRepository.create({
      name: input.name,
      slug: input.slug,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl,
      description: input.description,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
      configJson: input.configJson,
      searchKeywords: input.searchKeywords,
    });

    return this.mapEntityToDomain(entity);
  }

  /**
   * Update a subcategory
   */
  async updateSubcategory(
    id: string,
    input: Partial<{
      name: string;
      slug: string;
      categoryId: string;
      imageUrl: string | null;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
      configJson: Record<string, unknown> | null;
      searchKeywords: string[];
    }>
  ): Promise<Subcategory | null> {
    // If slug is being updated, check for conflicts
    if (input.slug) {
      const subcategory = await this.subcategoryRepository.findById(id);
      if (!subcategory) {
        return null;
      }

      const categoryId = input.categoryId || subcategory.categoryId;
      const existing = await this.subcategoryRepository.findBySlugAndCategoryId(
        input.slug,
        categoryId
      );

      if (existing && existing.id !== id) {
        throw new Error(
          `Subcategory with slug "${input.slug}" already exists in this category`
        );
      }
    }

    const entity = await this.subcategoryRepository.update(id, input);
    if (!entity) {
      return null;
    }

    return this.mapEntityToDomain(entity);
  }

  /**
   * Delete a subcategory (hard delete)
   */
  async deleteSubcategory(id: string): Promise<void> {
    const subcategory = await this.subcategoryRepository.findById(id);
    if (!subcategory) {
      throw new Error(`Subcategory not found with id ${id}`);
    }

    await this.subcategoryRepository.delete(id);
  }

  /**
   * Validate that subcategory belongs to category
   * Throws error if validation fails
   */
  async validateSubcategoryBelongsToCategory(
    subcategoryId: string,
    categoryId: string
  ): Promise<void> {
    const subcategory =
      await this.subcategoryRepository.findById(subcategoryId);
    if (!subcategory) {
      throw new Error(`Subcategory not found: ${subcategoryId}`);
    }

    if (subcategory.categoryId !== categoryId) {
      throw new Error(
        `Subcategory ${subcategoryId} does not belong to category ${categoryId}`
      );
    }
  }

  private mapEntityToDomain(entity: SubcategoryEntity): Subcategory {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      categoryId: entity.categoryId,
      imageUrl: entity.imageUrl,
      description: entity.description,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      configJson: entity.configJson,
      searchKeywords: entity.searchKeywords,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

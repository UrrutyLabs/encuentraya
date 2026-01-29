import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { CategoryRepository } from "./category.repo";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@repo/domain";

/**
 * Category service
 * Contains business logic for Category CRUD operations
 */
@injectable()
export class CategoryService {
  constructor(
    @inject(TOKENS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository
  ) {}

  // ========== Category CRUD Operations ==========

  /**
   * Get category by ID
   */
  async getCategoryById(
    id: string,
    includeDeleted = false
  ): Promise<Category | null> {
    return this.categoryRepository.findById(id, includeDeleted);
  }

  /**
   * Get category by key
   */
  async getCategoryByKey(
    key: string,
    includeDeleted = false
  ): Promise<Category | null> {
    return this.categoryRepository.findByKey(key, includeDeleted);
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<Category | null> {
    return this.categoryRepository.findBySlug(slug, includeDeleted);
  }

  /**
   * Get all categories (excluding soft-deleted by default)
   */
  async getAllCategories(includeDeleted = false): Promise<Category[]> {
    return this.categoryRepository.findAll(includeDeleted);
  }

  /**
   * Create a new category
   * If a soft-deleted category with the same key exists, reactivate it instead
   */
  async createCategory(input: CategoryCreateInput): Promise<Category> {
    // Check if a soft-deleted category with the same key exists
    const existing = await this.categoryRepository.findByKey(
      input.key,
      true // includeDeleted = true
    );

    if (existing && existing.deletedAt) {
      // Reactivate the soft-deleted category
      const restored = await this.categoryRepository.restore(existing.id);
      if (!restored) {
        throw new Error("Failed to restore category");
      }

      // Update with new data (preserve original id and createdAt)
      return (
        (await this.categoryRepository.update(existing.id, {
          name: input.name,
          slug: input.slug,
          iconName: input.iconName,
          description: input.description,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
          configJson: input.configJson,
        })) || restored
      );
    }

    if (existing && !existing.deletedAt) {
      throw new Error(`Category with key "${input.key}" already exists`);
    }

    // Create new category
    return this.categoryRepository.create(input);
  }

  /**
   * Update a category
   */
  async updateCategory(
    id: string,
    input: CategoryUpdateInput
  ): Promise<Category | null> {
    return this.categoryRepository.update(id, input);
  }

  /**
   * Soft delete a category (set deletedAt)
   */
  async deleteCategory(id: string): Promise<Category | null> {
    return this.categoryRepository.softDelete(id);
  }

  /**
   * Restore a soft-deleted category (set deletedAt = NULL)
   */
  async restoreCategory(id: string): Promise<Category | null> {
    return this.categoryRepository.restore(id);
  }
}

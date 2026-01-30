import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { CategoryRepository } from "./category.repo";
import type { SubcategoryRepository } from "../subcategory/subcategory.repo";

/**
 * Category/Subcategory config structure
 * Based on CATEGORIES.md specification
 */
export interface CategoryConfig {
  default_estimated_hours?: number;
  min_hours?: number;
  max_hours?: number;
  hour_step?: number;
  suggested_photos?: string[];
  quick_questions?: QuickQuestion[];
  disclaimer?: string;
  allow_tips?: boolean;
  show_arrived_step?: boolean;
  [key: string]: unknown; // Allow additional config keys
}

export interface QuickQuestion {
  key: string;
  label: string;
  type: "boolean" | "select" | "text" | "number";
  options?: string[]; // For select type
  required?: boolean;
}

/**
 * System defaults for category config
 */
const SYSTEM_DEFAULTS: CategoryConfig = {
  default_estimated_hours: 2,
  min_hours: 1,
  max_hours: 8,
  hour_step: 0.5,
  suggested_photos: [],
  quick_questions: [],
  allow_tips: true,
  show_arrived_step: false,
};

/**
 * Config service
 * Handles config inheritance: system defaults → category config → subcategory config
 */
@injectable()
export class ConfigService {
  constructor(
    @inject(TOKENS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository,
    @inject(TOKENS.SubcategoryRepository)
    private readonly subcategoryRepository: SubcategoryRepository
  ) {}

  /**
   * Get effective config for a subcategory
   * Merges: system defaults → category config → subcategory config
   */
  async getEffectiveConfig(
    categoryId: string,
    subcategoryId?: string
  ): Promise<CategoryConfig> {
    // Get category config
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    const categoryConfig = (category.configJson ||
      {}) as Partial<CategoryConfig>;

    // Start with system defaults
    const effectiveConfig: CategoryConfig = { ...SYSTEM_DEFAULTS };

    // Merge category config
    this.mergeConfig(effectiveConfig, categoryConfig);

    // If subcategory provided, merge subcategory config (overrides category)
    if (subcategoryId) {
      const subcategory =
        await this.subcategoryRepository.findById(subcategoryId);
      if (!subcategory) {
        throw new Error(`Subcategory not found: ${subcategoryId}`);
      }

      // Validate subcategory belongs to category
      if (subcategory.categoryId !== categoryId) {
        throw new Error(
          `Subcategory ${subcategoryId} does not belong to category ${categoryId}`
        );
      }

      const subcategoryConfig = (subcategory.configJson ||
        {}) as Partial<CategoryConfig>;
      this.mergeConfig(effectiveConfig, subcategoryConfig);
    }

    return effectiveConfig;
  }

  /**
   * Get effective config for a category only (no subcategory)
   */
  async getCategoryConfig(categoryId: string): Promise<CategoryConfig> {
    return this.getEffectiveConfig(categoryId);
  }

  /**
   * Merge config objects (deep merge for nested objects, array replacement)
   */
  private mergeConfig(
    target: CategoryConfig,
    source: Partial<CategoryConfig>
  ): void {
    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined values
      }

      // For arrays (suggested_photos, quick_questions), replace entirely
      if (Array.isArray(value)) {
        target[key] = value;
      }
      // For objects, merge recursively
      else if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        target[key] = {
          ...(target[key] as Record<string, unknown>),
          ...(value as Record<string, unknown>),
        };
      }
      // For primitives, replace
      else {
        target[key] = value;
      }
    }
  }

  /**
   * Validate config JSON structure
   */
  validateConfig(config: unknown): config is CategoryConfig {
    if (typeof config !== "object" || config === null) {
      return false;
    }

    const c = config as Record<string, unknown>;

    // Validate optional fields
    if (c.default_estimated_hours !== undefined) {
      if (typeof c.default_estimated_hours !== "number") {
        return false;
      }
    }

    if (c.min_hours !== undefined) {
      if (typeof c.min_hours !== "number") {
        return false;
      }
    }

    if (c.max_hours !== undefined) {
      if (typeof c.max_hours !== "number") {
        return false;
      }
    }

    if (c.suggested_photos !== undefined) {
      if (!Array.isArray(c.suggested_photos)) {
        return false;
      }
      if (!c.suggested_photos.every((p) => typeof p === "string")) {
        return false;
      }
    }

    if (c.quick_questions !== undefined) {
      if (!Array.isArray(c.quick_questions)) {
        return false;
      }
      // Validate quick question structure
      if (
        !c.quick_questions.every((q) => {
          if (typeof q !== "object" || q === null) {
            return false;
          }
          const question = q as Record<string, unknown>;
          return (
            typeof question.key === "string" &&
            typeof question.label === "string" &&
            typeof question.type === "string" &&
            ["boolean", "select", "text", "number"].includes(question.type)
          );
        })
      ) {
        return false;
      }
    }

    return true;
  }
}

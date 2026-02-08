import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { ProService } from "@modules/pro/pro.service";
import type { AvailabilityService } from "@modules/pro/availability.service";
import type { SearchCategoryRepository } from "@modules/search/searchCategory.repo";
import type {
  Pro,
  CategorySuggestion,
  SubcategorySuggestion,
} from "@repo/domain";

/**
 * Search service
 * Contains business logic for searching pros and resolving category/subcategory from text
 */
@injectable()
export class SearchService {
  constructor(
    @inject(TOKENS.ProService)
    private readonly proService: ProService,
    @inject(TOKENS.AvailabilityService)
    private readonly availabilityService: AvailabilityService,
    @inject(TOKENS.SearchCategoryRepository)
    private readonly searchCategoryRepository: SearchCategoryRepository
  ) {}

  /**
   * Resolve a free-text query to category/subcategory (for pro search when user submits "q").
   */
  async resolveQuery(q: string): Promise<{
    categoryId: string;
    subcategorySlug?: string;
  } | null> {
    return this.searchCategoryRepository.resolveQuery(q);
  }

  /**
   * Typeahead: search categories and subcategories by text (FTS + trigram).
   */
  async searchCategoriesAndSubcategories(
    q: string,
    limit?: number
  ): Promise<{
    categories: CategorySuggestion[];
    subcategories: SubcategorySuggestion[];
  }> {
    const result =
      await this.searchCategoryRepository.searchCategoriesAndSubcategories(
        q,
        limit
      );
    return {
      categories: result.categories,
      subcategories: result.subcategories,
    };
  }

  /**
   * Search for pros with filters
   * Business rules:
   * - If q is provided, resolve to categoryId (and optionally subcategory) and use for filtering
   * - Filter by category if provided (or from resolved q)
   * - Filter by availability:
   *   - If date only: pros available on that day of week
   *   - If timeWindow only: pros with availability slots that overlap with the time window
   *   - If both date and timeWindow: pros available in that time window on that day
   * - Only return approved and non-suspended pros
   */
  async searchPros(filters: {
    categoryId?: string; // FK to Category table
    subcategory?: string; // Subcategory slug (for future filtering)
    q?: string; // Free-text query; resolved to categoryId (+ subcategory) on server
    date?: Date;
    timeWindow?: string; // Format: "HH:MM-HH:MM" (e.g., "09:00-12:00")
  }): Promise<Pro[]> {
    let categoryId = filters.categoryId;
    let subcategory = filters.subcategory;

    if (filters.q?.trim()) {
      const resolved = await this.resolveQuery(filters.q.trim());
      if (resolved) {
        categoryId = resolved.categoryId;
        if (resolved.subcategorySlug) subcategory = resolved.subcategorySlug;
      }
    }

    // Get pros filtered by database (approved, not suspended, profileCompleted, categoryId)
    const basicFiltered = await this.proService.searchPros({
      categoryId,
    });

    // Step 2: Filter by availability based on what's provided
    const hasDateFilter = !!filters.date;
    const hasTimeWindowFilter = !!filters.timeWindow;

    if (hasDateFilter || hasTimeWindowFilter) {
      const availabilityFiltered = await Promise.all(
        basicFiltered.map(async (pro) => {
          let isAvailable = false;

          if (hasDateFilter && hasTimeWindowFilter) {
            // Both date and timeWindow: check if pro has slots that overlap with the window on that day
            isAvailable =
              await this.availabilityService.isProAvailableInTimeWindow(
                pro.id,
                filters.date!,
                filters.timeWindow!
              );
          } else if (hasDateFilter) {
            // Date only: check if pro has availability slots for that day of week
            isAvailable = await this.availabilityService.isProAvailableOnDay(
              pro.id,
              filters.date!
            );
          } else if (hasTimeWindowFilter) {
            // TimeWindow only: check if pro has availability slots that overlap with the window
            isAvailable =
              await this.availabilityService.isProAvailableInTimeWindowOnly(
                pro.id,
                filters.timeWindow!
              );
          }

          return isAvailable ? pro : null;
        })
      );

      // Remove null values (pros that don't match availability)
      return availabilityFiltered.filter((pro): pro is Pro => pro !== null);
    }

    // If no date/timeWindow filter, return basic filtered results
    return basicFiltered;
  }
}

import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { ProService } from "@modules/pro/pro.service";
import type { AvailabilityService } from "@modules/pro/availability.service";
import type { SearchCategoryRepository } from "@modules/search/searchCategory.repo";
import type { LocationService } from "@modules/location/location.service";
import type {
  Pro,
  CategorySuggestion,
  SubcategorySuggestion,
} from "@repo/domain";
import { haversineDistanceKm } from "@/server/shared/haversine";

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
    private readonly searchCategoryRepository: SearchCategoryRepository,
    @inject(TOKENS.LocationService)
    private readonly locationService: LocationService
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
   * - Filter by availability (date/timeWindow)
   * - If location (full address): geocode and filter by radius (pro.serviceRadiusKm), sort by distance
   * - Pros without base coords excluded when location filter is used
   * - Only return approved and non-suspended pros
   */
  async searchPros(filters: {
    categoryId?: string;
    subcategory?: string;
    q?: string;
    date?: Date;
    timeWindow?: string;
    location?: string; // Full address for geocoding (enables radius filter)
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
    let results = await this.proService.searchPros({
      categoryId,
    });

    // Step 2: Filter by availability based on what's provided
    const hasDateFilter = !!filters.date;
    const hasTimeWindowFilter = !!filters.timeWindow;

    if (hasDateFilter || hasTimeWindowFilter) {
      const availabilityFiltered = await Promise.all(
        results.map(async (pro) => {
          let isAvailable = false;

          if (hasDateFilter && hasTimeWindowFilter) {
            isAvailable =
              await this.availabilityService.isProAvailableInTimeWindow(
                pro.id,
                filters.date!,
                filters.timeWindow!
              );
          } else if (hasDateFilter) {
            isAvailable = await this.availabilityService.isProAvailableOnDay(
              pro.id,
              filters.date!
            );
          } else if (hasTimeWindowFilter) {
            isAvailable =
              await this.availabilityService.isProAvailableInTimeWindowOnly(
                pro.id,
                filters.timeWindow!
              );
          }

          return isAvailable ? pro : null;
        })
      );

      results = availabilityFiltered.filter((pro): pro is Pro => pro !== null);
    }

    // Step 3: Resolve user location (full address) and filter by radius
    const hasLocation = !!filters.location?.trim();

    if (hasLocation) {
      const resolvedLocation = await this.locationService.resolveUserLocation(
        "UY",
        { location: filters.location?.trim() }
      );

      if (
        resolvedLocation &&
        resolvedLocation.latitude != null &&
        resolvedLocation.longitude != null &&
        Number.isFinite(resolvedLocation.latitude) &&
        Number.isFinite(resolvedLocation.longitude)
      ) {
        const searchLat = resolvedLocation.latitude;
        const searchLng = resolvedLocation.longitude;

        // Filter: keep only pros within their serviceRadiusKm (default 10)
        results = results.filter((pro) => {
          const lat = pro.baseLatitude;
          const lng = pro.baseLongitude;
          if (
            lat == null ||
            lng == null ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return false;
          }
          const radiusKm = pro.serviceRadiusKm ?? 10;
          const distance = haversineDistanceKm(searchLat, searchLng, lat, lng);
          return distance <= radiusKm;
        });

        // Sort by distance (nearest first); secondary: isTopPro, rating, completedJobsCount
        results = [...results].sort((a, b) => {
          const distA = haversineDistanceKm(
            searchLat,
            searchLng,
            a.baseLatitude!,
            a.baseLongitude!
          );
          const distB = haversineDistanceKm(
            searchLat,
            searchLng,
            b.baseLatitude!,
            b.baseLongitude!
          );
          if (distA !== distB) return distA - distB;
          // Secondary: isTopPro, then rating, then completedJobsCount
          if ((b.isTopPro ? 1 : 0) !== (a.isTopPro ? 1 : 0))
            return (b.isTopPro ? 1 : 0) - (a.isTopPro ? 1 : 0);
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          return (b.completedJobsCount ?? 0) - (a.completedJobsCount ?? 0);
        });
      }
    }

    return results;
  }
}

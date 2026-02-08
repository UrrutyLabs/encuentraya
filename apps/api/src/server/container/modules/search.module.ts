import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { SearchCategoryRepository } from "@modules/search/searchCategory.repo";
import { SearchService } from "@modules/search/search.service";

/**
 * Register Search module dependencies
 * Depends on: ProService, AvailabilityService, SearchCategoryRepository
 */
export function registerSearchModule(container: DependencyContainer): void {
  container.register<SearchCategoryRepository>(
    TOKENS.SearchCategoryRepository,
    {
      useClass: SearchCategoryRepository,
    }
  );
  container.register<SearchService>(TOKENS.SearchService, {
    useClass: SearchService,
  });
}

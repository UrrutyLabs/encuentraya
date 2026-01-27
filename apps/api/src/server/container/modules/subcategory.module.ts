import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  SubcategoryRepository,
  SubcategoryRepositoryImpl,
} from "@modules/subcategory/subcategory.repo";
import { SubcategoryService } from "@modules/subcategory/subcategory.service";

/**
 * Register Subcategory module dependencies
 * No dependencies on other modules
 */
export function registerSubcategoryModule(
  container: DependencyContainer
): void {
  // Register repository
  container.register<SubcategoryRepository>(TOKENS.SubcategoryRepository, {
    useClass: SubcategoryRepositoryImpl,
  });

  // Register service (auto-resolves dependencies)
  container.register<SubcategoryService>(TOKENS.SubcategoryService, {
    useClass: SubcategoryService,
  });
}

import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  CategoryMetadataRepository,
  CategoryMetadataRepositoryImpl,
} from "@modules/category/category.repo";
import { CategoryService } from "@modules/category/category.service";

/**
 * Register Category module dependencies
 * No dependencies on other modules
 */
export function registerCategoryModule(container: DependencyContainer): void {
  // Register repository
  container.register<CategoryMetadataRepository>(
    TOKENS.CategoryMetadataRepository,
    {
      useClass: CategoryMetadataRepositoryImpl,
    }
  );

  // Register service (auto-resolves dependencies)
  container.register<CategoryService>(TOKENS.CategoryService, {
    useClass: CategoryService,
  });
}

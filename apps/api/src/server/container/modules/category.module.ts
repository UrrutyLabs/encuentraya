import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  CategoryRepository,
  CategoryRepositoryImpl,
} from "@modules/category/category.repo";
import { CategoryService } from "@modules/category/category.service";
import { ConfigService } from "@modules/category/config.service";

/**
 * Register Category module dependencies
 * Dependencies: SubcategoryRepository (for ConfigService)
 */
export function registerCategoryModule(container: DependencyContainer): void {
  // Register Category repository
  container.register<CategoryRepository>(TOKENS.CategoryRepository, {
    useClass: CategoryRepositoryImpl,
  });

  // Register CategoryService
  container.register<CategoryService>(TOKENS.CategoryService, {
    useClass: CategoryService,
  });

  // Register ConfigService (depends on CategoryRepository and SubcategoryRepository)
  container.register<ConfigService>(TOKENS.ConfigService, {
    useClass: ConfigService,
  });
}

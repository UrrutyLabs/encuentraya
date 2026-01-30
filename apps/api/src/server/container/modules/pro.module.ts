import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { ProRepository, ProRepositoryImpl } from "@modules/pro/pro.repo";
import {
  AvailabilityRepository,
  AvailabilityRepositoryImpl,
} from "@modules/pro/availability.repo";
import {
  ProProfileCategoryRepository,
  ProProfileCategoryRepositoryImpl,
} from "@modules/pro/proProfileCategory.repo";
import { ProService } from "@modules/pro/pro.service";
import { AvailabilityService } from "@modules/pro/availability.service";

/**
 * Register Pro module dependencies
 * Depends on: UserRepository, ReviewRepository, CategoryRepository
 */
export function registerProModule(container: DependencyContainer): void {
  // Register repositories
  container.register<ProRepository>(TOKENS.ProRepository, {
    useClass: ProRepositoryImpl,
  });

  container.register<AvailabilityRepository>(TOKENS.AvailabilityRepository, {
    useClass: AvailabilityRepositoryImpl,
  });

  container.register<ProProfileCategoryRepository>(
    TOKENS.ProProfileCategoryRepository,
    {
      useClass: ProProfileCategoryRepositoryImpl,
    }
  );

  // Register services (auto-resolves dependencies)
  container.register<AvailabilityService>(TOKENS.AvailabilityService, {
    useClass: AvailabilityService,
  });

  container.register<ProService>(TOKENS.ProService, {
    useClass: ProService,
  });
}

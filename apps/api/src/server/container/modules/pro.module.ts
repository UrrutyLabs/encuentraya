import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { ProRepository, ProRepositoryImpl } from "@modules/pro/pro.repo";
import {
  AvailabilityRepository,
  AvailabilityRepositoryImpl,
} from "@modules/pro/availability.repo";
import { ProService } from "@modules/pro/pro.service";
import { AvailabilityService } from "@modules/pro/availability.service";

/**
 * Register Pro module dependencies
 * Depends on: UserRepository, ReviewRepository
 */
export function registerProModule(container: DependencyContainer): void {
  // Register repositories
  container.register<ProRepository>(TOKENS.ProRepository, {
    useClass: ProRepositoryImpl,
  });

  container.register<AvailabilityRepository>(TOKENS.AvailabilityRepository, {
    useClass: AvailabilityRepositoryImpl,
  });

  // Register services (auto-resolves dependencies)
  container.register<AvailabilityService>(TOKENS.AvailabilityService, {
    useClass: AvailabilityService,
  });

  container.register<ProService>(TOKENS.ProService, {
    useClass: ProService,
  });
}

import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { UserRepository, UserRepositoryImpl } from "@modules/user/user.repo";
import {
  ClientProfileRepository,
  ClientProfileRepositoryImpl,
} from "@modules/user/clientProfile.repo";
import { ClientProfileService } from "@modules/user/clientProfile.service";

/**
 * Register User module dependencies
 * Foundation module - no dependencies on other modules
 */
export function registerUserModule(container: DependencyContainer): void {
  container.register<UserRepository>(TOKENS.UserRepository, {
    useClass: UserRepositoryImpl,
  });

  container.register<ClientProfileRepository>(TOKENS.ClientProfileRepository, {
    useClass: ClientProfileRepositoryImpl,
  });

  container.register<ClientProfileService>(TOKENS.ClientProfileService, {
    useClass: ClientProfileService,
  });
}

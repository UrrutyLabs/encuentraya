import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import { SupabaseAuthProvider } from "@infra/auth/providers/supabase.provider";
import type { AuthProvider } from "@infra/auth/provider";
import { logger } from "@infra/utils/logger";
import { createAvatarCache } from "@modules/avatar/avatar-cache";
import type { IAvatarCache } from "@modules/avatar/avatar-cache.types";

/**
 * Register Infrastructure module dependencies
 * Foundation module - provides shared infrastructure
 */
export function registerInfrastructureModule(
  container: DependencyContainer
): void {
  // Register auth provider
  container.register<AuthProvider>(TOKENS.AuthProvider, {
    useClass: SupabaseAuthProvider,
  });

  // Register logger (singleton)
  container.register("Logger", {
    useValue: logger,
  });

  // Avatar URL cache (Upstash Redis or no-op when not configured)
  container.register<IAvatarCache>(TOKENS.IAvatarCache, {
    useValue: createAvatarCache(),
  });
}

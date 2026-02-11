import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import type { IIdeUyGeocodingProvider } from "@modules/location/ide-geocoding.types";
import { IdeUyGeocodingClient } from "@modules/location/providers/ide-uy.client";
import { LocationService } from "@modules/location/location.service";

/**
 * Register Location module dependencies.
 * Phase 2: IDE Uruguay geocoding provider.
 * Phase 3: LocationService for router.
 */
export function registerLocationModule(container: DependencyContainer): void {
  container.register<IIdeUyGeocodingProvider>(TOKENS.IIdeUyGeocodingProvider, {
    useFactory: () => new IdeUyGeocodingClient(),
  });
  container.register(TOKENS.LocationService, LocationService);
}

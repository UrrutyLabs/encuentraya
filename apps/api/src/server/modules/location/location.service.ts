/**
 * Location service: geocoding (IDE Uruguay) for address suggestions and reverse geocode.
 * resolveUserLocation returns coords for search radius filtering.
 */

import { injectable, inject } from "tsyringe";
import type { IIdeUyGeocodingProvider } from "./ide-geocoding.types";
import type {
  GeocodeResult,
  AddressCandidate,
  ReverseGeocodeResult,
} from "./ide-geocoding.types";
import { TOKENS } from "@/server/container/tokens";

const UY_COUNTRY_CODE = "UY";

@injectable()
export class LocationService {
  constructor(
    @inject(TOKENS.IIdeUyGeocodingProvider)
    private readonly ideGeocoding: IIdeUyGeocodingProvider
  ) {}

  /** Address autocomplete. For UY calls IDE candidates; other countries return []. */
  async getAddressSuggestions(
    q: string,
    countryCode: string
  ): Promise<AddressCandidate[]> {
    if (countryCode.toUpperCase() !== UY_COUNTRY_CODE) {
      return [];
    }
    if (!q?.trim()) {
      return [];
    }
    return this.ideGeocoding.getCandidates(q.trim());
  }

  /**
   * Geocode one address (string or candidate id).
   * For UY calls IDE direcUnica; other countries return null.
   */
  async geocodeAddress(
    countryCode: string,
    addressOrRef: string | { candidateId: string }
  ): Promise<GeocodeResult | null> {
    if (countryCode.toUpperCase() !== UY_COUNTRY_CODE) {
      return null;
    }
    const ref =
      typeof addressOrRef === "string"
        ? addressOrRef.trim()
        : { id: addressOrRef.candidateId };
    if (typeof ref === "string" && !ref) {
      return null;
    }
    return this.ideGeocoding.geocodeAddress(ref);
  }

  /**
   * Reverse geocode: coords → postalCode, department, addressLine.
   * For client auto-detect zip on load. For UY calls IDE; other countries return null.
   */
  async reverseGeocode(
    countryCode: string,
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult | null> {
    if (countryCode.toUpperCase() !== UY_COUNTRY_CODE) {
      return null;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    const result = await this.ideGeocoding.reverseGeocode(latitude, longitude);
    if (!result) return null;
    return {
      postalCode: result.postalCode?.trim(),
      department: result.department?.trim(),
      addressLine: result.addressLine?.trim(),
    };
  }

  /**
   * Resolve full address to coords for search radius filtering.
   * Geocodes via IDE direcUnica. Returns { latitude, longitude } or null if cannot resolve.
   */
  async resolveUserLocation(
    countryCode: string,
    options: { location?: string }
  ): Promise<{ latitude: number; longitude: number } | null> {
    if (countryCode.toUpperCase() !== UY_COUNTRY_CODE) {
      return null;
    }
    const { location } = options;

    if (!location?.trim()) {
      return null;
    }

    const geocoded = await this.ideGeocoding.geocodeAddress(location.trim());
    if (
      !geocoded ||
      geocoded.latitude == null ||
      geocoded.longitude == null ||
      !Number.isFinite(geocoded.latitude) ||
      !Number.isFinite(geocoded.longitude)
    ) {
      return null;
    }
    return {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    };
  }
}

/**
 * DTOs and provider interface for IDE Uruguay geocoding.
 * Keeps IDE response shape out of the rest of the app.
 * @see docs/PLAN_LOCATION_PRO_SEARCH.md Phase 2
 */

/** Result of geocoding one address (from direcUnica/find) */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  postalCode?: string;
  department?: string;
  addressLine?: string;
}

/** Suggestion item for address autocomplete (from candidates) */
export interface AddressCandidate {
  id?: string;
  label: string;
  /** Optional raw value for follow-up geocode (e.g. direcUnica) */
  raw?: unknown;
}

/** Result of reverse geocoding (coords → address components) */
export interface ReverseGeocodeResult {
  postalCode?: string;
  department?: string;
  addressLine?: string;
}

/**
 * Provider for Uruguay geocoding (IDE Uruguay).
 * Implementations wrap the IDE HTTP API and map to these DTOs.
 */
export interface IIdeUyGeocodingProvider {
  /** Address autocomplete suggestions. */
  getCandidates(query: string): Promise<AddressCandidate[]>;

  /**
   * Geocode a single address (string or candidate ref).
   * Returns null if no result or API error.
   */
  geocodeAddress(
    addressOrRef: string | { id: string }
  ): Promise<GeocodeResult | null>;

  /**
   * Reverse geocode: coords → address components.
   * Returns null if no result or API error.
   */
  reverseGeocode(
    lat: number,
    lng: number
  ): Promise<ReverseGeocodeResult | null>;
}

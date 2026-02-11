"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useGeolocation } from "@/hooks/shared/useGeolocation";
import { useReverseGeocode } from "@/hooks/search/useReverseGeocode";

type SearchLocationContextValue = {
  /** Auto-detected zip from geolocation + reverse geocode; null while loading or on failure. */
  initialZipCode: string | null;
  /** Full address for geocoding (from reverse geocode). Enables radius filter in search. */
  initialLocation: string | null;
  /** True while geolocation or reverse geocode is in progress. */
  isLoading: boolean;
};

const SearchLocationContext = createContext<SearchLocationContextValue | null>(
  null
);

export function SearchLocationProvider({ children }: { children: ReactNode }) {
  const {
    position,
    error: _geoError,
    isLoading: geoLoading,
  } = useGeolocation({ runOnMount: true });
  const {
    postalCode,
    department,
    addressLine,
    isLoading: reverseLoading,
    isSuccess: reverseSuccess,
  } = useReverseGeocode(position?.lat, position?.lng);

  const value = useMemo<SearchLocationContextValue>(() => {
    const initialZipCode =
      reverseSuccess && postalCode?.trim() ? postalCode.trim() : null;
    const initialLocation =
      reverseSuccess && addressLine?.trim()
        ? addressLine.trim()
        : reverseSuccess && department?.trim() && postalCode?.trim()
          ? `${department.trim()}, ${postalCode.trim()}`
          : reverseSuccess && postalCode?.trim()
            ? postalCode.trim()
            : null;
    return {
      initialZipCode,
      initialLocation,
      isLoading: geoLoading || reverseLoading,
    };
  }, [
    postalCode,
    department,
    addressLine,
    reverseSuccess,
    geoLoading,
    reverseLoading,
  ]);

  return (
    <SearchLocationContext.Provider value={value}>
      {children}
    </SearchLocationContext.Provider>
  );
}

export function useSearchLocation(): SearchLocationContextValue {
  const ctx = useContext(SearchLocationContext);
  if (ctx == null) {
    return {
      initialZipCode: null,
      initialLocation: null,
      isLoading: false,
    };
  }
  return ctx;
}

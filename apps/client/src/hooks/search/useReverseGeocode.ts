import { trpc } from "@/lib/trpc/client";

const DEFAULT_COUNTRY = "UY";

/**
 * Fetches postal code (and department, addressLine) from lat/lng via backend reverse geocode.
 * Only runs when both lat and lng are provided. Silent failure (null) when API fails.
 */
export function useReverseGeocode(
  lat: number | null | undefined,
  lng: number | null | undefined,
  countryCode: string = DEFAULT_COUNTRY
) {
  const enabled =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  const result = trpc.location.reverseGeocode.useQuery(
    {
      latitude: lat ?? 0,
      longitude: lng ?? 0,
      countryCode,
    },
    {
      enabled,
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  return {
    postalCode: result.data?.postalCode ?? null,
    department: result.data?.department ?? null,
    addressLine: result.data?.addressLine ?? null,
    isLoading: enabled && result.isLoading,
    isSuccess: result.isSuccess,
    isError: result.isError,
  };
}

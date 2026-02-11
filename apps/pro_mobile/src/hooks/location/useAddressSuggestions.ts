import { useMemo } from "react";
import { trpc } from "@lib/trpc/client";
import { useDebouncedValue } from "@hooks/shared";

const DEFAULT_COUNTRY = "UY";
const DEBOUNCE_MS = 300;

/**
 * Address autocomplete suggestions (Uruguay IDE).
 * Query is debounced to avoid excessive API calls.
 */
export function useAddressSuggestions(
  query: string,
  countryCode: string = DEFAULT_COUNTRY
) {
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  const enabled =
    countryCode.toUpperCase() === "UY" && debouncedQuery.length >= 2;

  const queryResult = trpc.location.addressSuggestions.useQuery(
    { countryCode, q: debouncedQuery },
    { enabled }
  );

  return useMemo(
    () => ({
      ...queryResult,
      suggestions: queryResult.data ?? [],
    }),
    [queryResult]
  );
}

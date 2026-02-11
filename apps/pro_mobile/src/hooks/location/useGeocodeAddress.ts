import { trpc } from "@lib/trpc/client";

const DEFAULT_COUNTRY = "UY";

type GeocodeInput =
  | { address: string; candidateId?: never }
  | { address?: never; candidateId: string };

/**
 * Geocodes an address or a suggestion candidate (Uruguay IDE).
 * Only runs when exactly one of address or candidateId is provided.
 */
export function useGeocodeAddress(
  input: GeocodeInput | null,
  countryCode: string = DEFAULT_COUNTRY
) {
  const hasAddress = input?.address != null && input.address.trim() !== "";
  const hasCandidate =
    input?.candidateId != null && input.candidateId.trim() !== "";
  const enabled =
    countryCode.toUpperCase() === "UY" &&
    hasAddress !== hasCandidate &&
    input != null;

  return trpc.location.geocodeAddress.useQuery(
    {
      countryCode,
      ...(hasAddress
        ? { address: input!.address!.trim() }
        : { candidateId: input!.candidateId!.trim() }),
    },
    { enabled }
  );
}

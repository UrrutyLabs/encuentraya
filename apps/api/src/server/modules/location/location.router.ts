import { z } from "zod";
import { router, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { LocationService } from "./location.service";
import { TRPCError } from "@trpc/server";

const locationService = container.resolve<LocationService>(
  TOKENS.LocationService
);

const addressSuggestionsInputSchema = z.object({
  q: z.string().min(1),
  countryCode: z.string().length(2),
});

const reverseGeocodeInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  countryCode: z.string().length(2),
});

const geocodeAddressInputSchema = z
  .object({
    address: z.string().optional(),
    candidateId: z.string().optional(),
    countryCode: z.string().length(2),
  })
  .refine(
    (data) => {
      const hasAddress = data.address != null && data.address.trim() !== "";
      const hasCandidate =
        data.candidateId != null && data.candidateId.trim() !== "";
      return hasAddress !== hasCandidate; // exactly one
    },
    { message: "Provide exactly one of address or candidateId" }
  );

export const locationRouter = router({
  addressSuggestions: publicProcedure
    .input(addressSuggestionsInputSchema)
    .query(async ({ input }) => {
      try {
        return await locationService.getAddressSuggestions(
          input.q,
          input.countryCode
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get address suggestions",
        });
      }
    }),

  geocodeAddress: publicProcedure
    .input(geocodeAddressInputSchema)
    .query(async ({ input }) => {
      try {
        const addressOrRef =
          input.address != null && input.address.trim() !== ""
            ? input.address.trim()
            : { candidateId: input.candidateId! };
        const result = await locationService.geocodeAddress(
          input.countryCode,
          addressOrRef
        );
        if (result == null) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Address could not be geocoded",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to geocode address",
        });
      }
    }),

  reverseGeocode: publicProcedure
    .input(reverseGeocodeInputSchema)
    .query(async ({ input }) => {
      try {
        const result = await locationService.reverseGeocode(
          input.countryCode,
          input.latitude,
          input.longitude
        );
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to reverse geocode",
        });
      }
    }),
});

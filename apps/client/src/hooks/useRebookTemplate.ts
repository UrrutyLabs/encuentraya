import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch rebook template from a completed booking
 * Returns data needed to prefill a new booking form
 */
export function useRebookTemplate(bookingId: string | undefined) {
  return trpc.booking.rebookTemplate.useQuery(
    { bookingId: bookingId! },
    {
      enabled: !!bookingId,
      retry: false,
    }
  );
}

"use client";

import { useMemo } from "react";
import { Calendar, History } from "lucide-react";
import { Text } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { BookingCard } from "@/components/presentational/BookingCard";
import { EmptyState } from "@/components/presentational/EmptyState";
import { MyBookingsSkeleton } from "@/components/presentational/MyBookingsSkeleton";
import { useMyBookings } from "@/hooks/useMyBookings";
import { BookingStatus } from "@repo/domain";

export function MyBookingsScreen() {
  const { bookings, isLoading, reviewStatusMap } = useMyBookings();

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcomingBookings = bookings.filter((booking) => {
      const scheduledDate = new Date(booking.scheduledAt);
      return (
        scheduledDate >= now &&
        booking.status !== BookingStatus.COMPLETED &&
        booking.status !== BookingStatus.CANCELLED &&
        booking.status !== BookingStatus.REJECTED
      );
    });

    const pastBookings = bookings.filter((booking) => {
      const scheduledDate = new Date(booking.scheduledAt);
      return (
        scheduledDate < now ||
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.REJECTED
      );
    });

    return {
      upcoming: upcomingBookings,
      past: pastBookings,
    };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-8 text-primary">
            Mis reservas
          </Text>

          {isLoading ? (
            <MyBookingsSkeleton />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No tenés reservas"
              description="Cuando hagas una reserva, aparecerá aquí."
              icon="inbox"
            />
          ) : (
            <div className="space-y-8">
              {/* Upcoming Bookings */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <Text variant="h2" className="text-text">
                    Próximas
                  </Text>
                </div>
                {upcoming.length === 0 ? (
                  <Card className="p-6">
                    <Text variant="body" className="text-muted text-center">
                      No tenés reservas próximas
                    </Text>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </section>

              {/* Past Bookings */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-muted" />
                  <Text variant="h2" className="text-text">
                    Pasadas
                  </Text>
                </div>
                {past.length === 0 ? (
                  <Card className="p-6">
                    <Text variant="body" className="text-muted text-center">
                      No tenés reservas pasadas
                    </Text>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {past.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        hasReview={reviewStatusMap[booking.id] ?? false}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { BookingCard } from "@components/presentational/BookingCard";
import { JobsSkeleton } from "@components/presentational/JobsSkeleton";
import { BookingStatus, Booking } from "@repo/domain";
import { theme } from "../../theme";
import { useProJobs } from "@hooks/booking";

export function JobsScreen() {
  const router = useRouter();

  // Fetch pro jobs bookings via hook
  const { bookings, isLoading, error } = useProJobs();

  // Filter bookings into upcoming (accepted and arrived) and completed
  const { upcoming, completed } = useMemo<{
    upcoming: Booking[];
    completed: Booking[];
  }>(() => {
    const upcomingBookings = bookings.filter(
      (booking: Booking) =>
        booking.status === BookingStatus.ACCEPTED ||
        booking.status === BookingStatus.ARRIVED
    );

    const completedBookings = bookings.filter(
      (booking: Booking) => booking.status === BookingStatus.COMPLETED
    );

    return {
      upcoming: upcomingBookings,
      completed: completedBookings,
    };
  }, [bookings]);

  // Memoize card press handler to prevent unnecessary re-renders of BookingCard
  const handleCardPress = useCallback(
    (bookingId: string) => {
      router.push(`/booking/${bookingId}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <JobsSkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={theme.colors.danger} />
        <Text variant="body" style={styles.error}>
          Error al cargar trabajos
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="clock" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Próximos
          </Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clock" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              No hay trabajos próximos
            </Text>
          </View>
        ) : (
          upcoming.map((booking: Booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={() => handleCardPress(booking.id)}
            />
          ))
        )}
      </View>

      {/* Completed Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="check-circle" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Completados
          </Text>
        </View>
        {completed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              No hay trabajos completados
            </Text>
          </View>
        ) : (
          completed.map((booking: Booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={() => handleCardPress(booking.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing[4],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
  },
  loadingText: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
  },
  error: {
    color: theme.colors.danger,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    marginLeft: theme.spacing[2],
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[8],
  },
  empty: {
    marginTop: theme.spacing[3],
    color: theme.colors.muted,
    textAlign: "center",
  },
});

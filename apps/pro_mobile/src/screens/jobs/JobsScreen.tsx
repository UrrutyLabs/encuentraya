import { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { BookingCard } from "../../components/presentational/BookingCard";
import { BookingStatus, Booking } from "@repo/domain";
import { theme } from "../../theme";
import { useProJobs } from "../../hooks/useProJobs";

export function JobsScreen() {
  const router = useRouter();
  
  // Fetch pro jobs bookings via hook
  const { bookings, isLoading, error } = useProJobs();

  // Filter bookings into upcoming (accepted and arrived) and completed
  const { upcoming, completed } = useMemo<{ upcoming: Booking[]; completed: Booking[] }>(() => {
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

  const handleCardPress = (bookingId: string) => {
    router.push(`/booking/${bookingId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" style={styles.loadingText}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text variant="body" style={styles.error}>
          Error al cargar trabajos
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text variant="h2" style={styles.sectionTitle}>
          Próximos
        </Text>
        {upcoming.length === 0 ? (
          <Text variant="body" style={styles.empty}>
            No hay trabajos próximos
          </Text>
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
        <Text variant="h2" style={styles.sectionTitle}>
          Completados
        </Text>
        {completed.length === 0 ? (
          <Text variant="body" style={styles.empty}>
            No hay trabajos completados
          </Text>
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
  sectionTitle: {
    marginBottom: theme.spacing[3],
  },
  empty: {
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: theme.spacing[4],
  },
});

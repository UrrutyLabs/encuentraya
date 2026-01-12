import { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../components/ui/Text";
import { BookingCard } from "../../components/presentational/BookingCard";
import { Booking, BookingStatus } from "@repo/domain";
import { theme } from "../../theme";
import { useProInbox } from "../../hooks/useProInbox";

export function HomeScreen() {
  const router = useRouter();
  
  // Fetch pro inbox bookings via hook
  const { bookings, isLoading, error } = useProInbox();

  // Filter bookings into pending and accepted
  const { pending, upcoming } = useMemo(() => {
    const pendingBookings = bookings.filter(
      (booking: Booking) => booking.status === BookingStatus.PENDING
    );
    
    const upcomingBookings = bookings.filter(
      (booking: Booking) => booking.status === BookingStatus.ACCEPTED
    );

    return {
      pending: pendingBookings,
      upcoming: upcomingBookings,
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
          Solicitudes nuevas
        </Text>
        {pending.length === 0 ? (
          <Text variant="body" style={styles.empty}>
            No hay solicitudes nuevas
          </Text>
        ) : (
          pending.map((booking: Booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPress={() => handleCardPress(booking.id)}
            />
          ))
        )}
      </View>

      {/* Upcoming Jobs Section */}
      <View style={styles.section}>
        <Text variant="h2" style={styles.sectionTitle}>
          Próximos trabajos
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

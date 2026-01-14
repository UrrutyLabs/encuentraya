import { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../components/ui/Text";
import { BookingCard } from "../../components/presentational/BookingCard";
import { HomeSkeleton } from "../../components/presentational/HomeSkeleton";
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <HomeSkeleton />
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
          <Feather name="bell" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Solicitudes nuevas
          </Text>
        </View>
        {pending.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.colors.muted} />
            <Text variant="body" style={styles.empty}>
              No hay solicitudes nuevas
            </Text>
          </View>
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
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Próximos trabajos
          </Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={theme.colors.muted} />
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

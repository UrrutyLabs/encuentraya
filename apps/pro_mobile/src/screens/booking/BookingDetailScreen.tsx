import { View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text } from "../../components/ui/Text";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useBookingActions } from "../../hooks/useBookingActions";
import { trpc } from "../../lib/trpc/client";
import { BookingStatus, Category } from "@repo/domain";
import { theme } from "../../theme";

const categoryLabels: Record<string, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Arreglos generales",
  [Category.PAINTING]: "Pintura",
};

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.ACCEPTED]: "Aceptada",
  [BookingStatus.ARRIVED]: "Llegó",
  [BookingStatus.REJECTED]: "Rechazada",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.CANCELLED]: "Cancelada",
};

const statusVariants: Record<BookingStatus, "success" | "warning" | "danger" | "info"> = {
  [BookingStatus.PENDING]: "info",
  [BookingStatus.ACCEPTED]: "success",
  [BookingStatus.ARRIVED]: "success",
  [BookingStatus.REJECTED]: "danger",
  [BookingStatus.COMPLETED]: "success",
  [BookingStatus.CANCELLED]: "warning",
};

export function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [localStatus, setLocalStatus] = useState<BookingStatus | null>(null);

  // Fetch booking by id
  const { data: booking, isLoading, error, refetch } = trpc.booking.getById.useQuery(
    { id: bookingId || "" },
    { enabled: !!bookingId, retry: false }
  );

  const { acceptBooking, rejectBooking, arriveBooking, completeBooking, isAccepting, isRejecting, isArriving, isCompleting, error: actionError } = useBookingActions(() => {
    // Refetch booking data after successful action
    refetch();
  });

  // Use local status if set, otherwise use booking status
  const displayStatus = localStatus || booking?.status;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" style={styles.loadingText}>
          Cargando reserva...
        </Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.center}>
        <Text variant="body" style={styles.error}>
          {error?.message || "Reserva no encontrada"}
        </Text>
      </View>
    );
  }

  const handleAccept = async () => {
    if (!bookingId) return;
    try {
      await acceptBooking(bookingId);
      setLocalStatus(BookingStatus.ACCEPTED);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleReject = async () => {
    if (!bookingId) return;
    try {
      await rejectBooking(bookingId);
      setLocalStatus(BookingStatus.REJECTED);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleArrive = async () => {
    if (!bookingId) return;
    try {
      await arriveBooking(bookingId);
      setLocalStatus(BookingStatus.ARRIVED);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleComplete = async () => {
    if (!bookingId) return;
    try {
      await completeBooking(bookingId);
      setLocalStatus(BookingStatus.COMPLETED);
    } catch (err) {
      // Error handled by hook
    }
  };

  const statusLabel = displayStatus ? statusLabels[displayStatus] : "";
  const statusVariant = displayStatus ? statusVariants[displayStatus] : "info";
  const categoryLabel = categoryLabels[booking.category] || booking.category;

  const formattedDate = new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(booking.scheduledAt));

  const canAccept = displayStatus === BookingStatus.PENDING;
  const canReject = displayStatus === BookingStatus.PENDING;
  const canArrive = displayStatus === BookingStatus.ACCEPTED;
  const canComplete = displayStatus === BookingStatus.ARRIVED;
  const isReadOnly = displayStatus === BookingStatus.COMPLETED || displayStatus === BookingStatus.CANCELLED || displayStatus === BookingStatus.REJECTED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">Detalle de reserva</Text>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </View>

      <Card style={styles.card}>
        <Text variant="h2" style={styles.sectionTitle}>
          Resumen
        </Text>
        <View style={styles.row}>
          <Text variant="small" style={styles.label}>
            Categoría:
          </Text>
          <Text variant="body">{categoryLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text variant="small" style={styles.label}>
            Fecha y hora:
          </Text>
          <Text variant="body">{formattedDate}</Text>
        </View>
        <View style={styles.row}>
          <Text variant="small" style={styles.label}>
            Horas estimadas:
          </Text>
          <Text variant="body">{booking.estimatedHours}</Text>
        </View>
        <View style={styles.row}>
          <Text variant="small" style={styles.label}>
            Descripción:
          </Text>
          <Text variant="body" style={styles.description}>
            {booking.description}
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="small" style={styles.label}>
            Total estimado:
          </Text>
          <Text variant="h2" style={styles.amount}>
            ${booking.totalAmount.toFixed(2)}
          </Text>
        </View>
      </Card>

      {/* Actions */}
      {actionError && (
        <Card style={styles.errorCard}>
          <Text variant="small" style={styles.errorText}>
            {actionError}
          </Text>
        </Card>
      )}

      {!isReadOnly && (
        <Card style={styles.actionsCard}>
          <Text variant="h2" style={styles.sectionTitle}>
            Acciones
          </Text>

          {canAccept && (
            <Button
              variant="primary"
              onPress={handleAccept}
              disabled={isAccepting || isRejecting}
              style={styles.actionButton}
            >
              {isAccepting ? "Aceptando..." : "Aceptar"}
            </Button>
          )}

          {canReject && (
            <Button
              variant="danger"
              onPress={handleReject}
              disabled={isAccepting || isRejecting}
              style={styles.actionButton}
            >
              {isRejecting ? "Rechazando..." : "Rechazar"}
            </Button>
          )}

          {canArrive && (
            <Button
              variant="primary"
              onPress={handleArrive}
              disabled={isArriving}
              style={styles.actionButton}
            >
              {isArriving ? "Marcando..." : "Marcar como llegado"}
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              onPress={handleComplete}
              disabled={isCompleting}
              style={styles.actionButton}
            >
              {isCompleting ? "Completando..." : "Marcar como completado"}
            </Button>
          )}
        </Card>
      )}
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
  errorCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: `${theme.colors.danger}1A`,
    borderColor: theme.colors.danger,
  },
  errorText: {
    color: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing[2],
  },
  actionsCard: {
    marginBottom: theme.spacing[4],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    marginBottom: theme.spacing[3],
  },
  row: {
    marginBottom: theme.spacing[3],
  },
  label: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[1],
  },
  description: {
    marginTop: theme.spacing[1],
  },
  amount: {
    color: theme.colors.primary,
    marginTop: theme.spacing[1],
  },
  actions: {
    marginTop: theme.spacing[4],
  },
  actionButton: {
    marginBottom: theme.spacing[2],
  },
});

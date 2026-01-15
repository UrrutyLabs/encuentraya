import { View, StyleSheet, ScrollView } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../components/ui/Text";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { BookingDetailSkeleton } from "../../components/presentational/BookingDetailSkeleton";
import { useBookingActions } from "../../hooks/useBookingActions";
import { useBookingDetail } from "../../hooks/useBookingDetail";
import { BookingStatus, Category, getBookingStatusLabel, getBookingStatusVariant } from "@repo/domain";
import { theme } from "../../theme";

const categoryLabels: Record<string, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Arreglos generales",
  [Category.PAINTING]: "Pintura",
};


export function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [localStatus, setLocalStatus] = useState<BookingStatus | null>(null);

  // Fetch booking by id via hook
  const { booking, isLoading, error, refetch } = useBookingDetail(bookingId);

  const { acceptBooking, rejectBooking, markOnMyWay, arriveBooking, completeBooking, isAccepting, isRejecting, isMarkingOnMyWay, isArriving, isCompleting, error: actionError } = useBookingActions(() => {
    // Refetch booking data after successful action
    refetch();
  });

  // Use local status if set, otherwise use booking status
  const displayStatus: BookingStatus | null = localStatus || (booking?.status as BookingStatus) || null;

  // Memoize handlers to prevent unnecessary re-renders
  // Must be called before early returns (React Rules of Hooks)
  const handleAccept = useCallback(async () => {
    if (!bookingId) return;
    try {
      await acceptBooking(bookingId);
      setLocalStatus(BookingStatus.ACCEPTED);
    } catch {
      // Error handled by hook
    }
  }, [bookingId, acceptBooking]);

  const handleReject = useCallback(async () => {
    if (!bookingId) return;
    try {
      await rejectBooking(bookingId);
      setLocalStatus(BookingStatus.REJECTED);
    } catch {
      // Error handled by hook
    }
  }, [bookingId, rejectBooking]);

  const handleMarkOnMyWay = useCallback(async () => {
    if (!bookingId) return;
    try {
      await markOnMyWay(bookingId);
      setLocalStatus(BookingStatus.ON_MY_WAY);
    } catch {
      // Error handled by hook
    }
  }, [bookingId, markOnMyWay]);

  const handleArrive = useCallback(async () => {
    if (!bookingId) return;
    try {
      await arriveBooking(bookingId);
      setLocalStatus(BookingStatus.ARRIVED);
    } catch {
      // Error handled by hook
    }
  }, [bookingId, arriveBooking]);

  const handleComplete = useCallback(async () => {
    if (!bookingId) return;
    try {
      await completeBooking(bookingId);
      setLocalStatus(BookingStatus.COMPLETED);
    } catch {
      // Error handled by hook
    }
  }, [bookingId, completeBooking]);

  // Memoize computed values (must be before early returns)
  const statusLabel = useMemo(
    () => (displayStatus ? getBookingStatusLabel(displayStatus as BookingStatus) : ""),
    [displayStatus]
  );
  
  const statusVariant = useMemo(
    () => (displayStatus ? getBookingStatusVariant(displayStatus as BookingStatus) : "info"),
    [displayStatus]
  );
  
  const categoryLabel = useMemo(
    () => (booking ? categoryLabels[booking.category] || booking.category : ""),
    [booking]
  );

  const formattedDate = useMemo(
    () =>
      booking
        ? new Intl.DateTimeFormat("es-UY", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(booking.scheduledAt))
        : "",
    [booking]
  );

  if (isLoading) {
    return <BookingDetailSkeleton />;
  }

  if (error || !booking) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={theme.colors.danger} />
        <Text variant="body" style={styles.error}>
          {error?.message || "Reserva no encontrada"}
        </Text>
      </View>
    );
  }

  const canAccept = displayStatus === BookingStatus.PENDING;
  const canReject = displayStatus === BookingStatus.PENDING;
  const canMarkOnMyWay = displayStatus === BookingStatus.ACCEPTED;
  const canArrive = displayStatus === BookingStatus.ON_MY_WAY;
  const canComplete = displayStatus === BookingStatus.ARRIVED;
  const isReadOnly = displayStatus === BookingStatus.COMPLETED || displayStatus === BookingStatus.CANCELLED || displayStatus === BookingStatus.REJECTED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">Detalle de reserva</Text>
        <Badge variant={statusVariant} showIcon>
          {statusLabel}
        </Badge>
      </View>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Resumen
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="tag" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Categoría:
            </Text>
          </View>
          <Text variant="body">{categoryLabel}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="calendar" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Fecha y hora:
            </Text>
          </View>
          <Text variant="body">{formattedDate}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="clock" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Horas estimadas:
            </Text>
          </View>
          <Text variant="body">{booking.estimatedHours}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="file-text" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Descripción:
            </Text>
          </View>
          <Text variant="body" style={styles.description}>
            {booking.description}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="dollar-sign" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Total estimado:
            </Text>
          </View>
          <Text variant="h2" style={styles.amount}>
            ${booking.totalAmount.toFixed(2)}
          </Text>
        </View>
      </Card>

      {/* Actions */}
      {actionError && (
        <Card style={styles.errorCard}>
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={16} color={theme.colors.danger} />
            <Text variant="small" style={styles.errorText}>
              {actionError}
            </Text>
          </View>
        </Card>
      )}

      {!isReadOnly && (
        <Card style={styles.actionsCard}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={20} color={theme.colors.primary} />
            <Text variant="h2" style={styles.sectionTitle}>
              Acciones
            </Text>
          </View>

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

          {canMarkOnMyWay && (
            <Button
              variant="primary"
              onPress={handleMarkOnMyWay}
              disabled={isMarkingOnMyWay}
              style={styles.actionButton}
            >
              {isMarkingOnMyWay ? "Marcando..." : "Marcar como en camino"}
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
  errorCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: `${theme.colors.danger}1A`,
    borderColor: theme.colors.danger,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: theme.spacing[1],
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    marginLeft: theme.spacing[2],
  },
  row: {
    marginBottom: theme.spacing[3],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  label: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
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

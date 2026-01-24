import React, { useMemo } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import type { Booking } from "@repo/domain";
import {
  Category,
  BookingStatus,
  getBookingStatusLabel,
  getBookingStatusVariant,
} from "@repo/domain";
import { theme } from "../../theme";

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
}

const categoryLabels: Record<string, string> = {
  [Category.PLUMBING]: "Plomería",
  [Category.ELECTRICAL]: "Electricidad",
  [Category.CLEANING]: "Limpieza",
  [Category.HANDYMAN]: "Arreglos generales",
  [Category.PAINTING]: "Pintura",
};

function BookingCardComponent({ booking, onPress }: BookingCardProps) {
  // Memoize computed values to avoid recalculation on re-renders
  const categoryLabel = useMemo(
    () => categoryLabels[booking.category] || booking.category,
    [booking.category]
  );

  const statusLabel = useMemo(
    () => getBookingStatusLabel(booking.status),
    [booking.status]
  );

  const statusVariant = useMemo(
    () => getBookingStatusVariant(booking.status),
    [booking.status]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-UY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(booking.scheduledAt)),
    [booking.scheduledAt]
  );

  const descriptionLines = useMemo(
    () => booking.description.split("\n").slice(0, 2).join("\n"),
    [booking.description]
  );

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <Text variant="h2" style={styles.category}>
              {categoryLabel}
            </Text>
          </View>
          <View style={styles.badgesContainer}>
            {booking.isFirstBooking &&
              booking.status !== BookingStatus.COMPLETED && (
                <Badge variant="new">Nuevo Cliente</Badge>
              )}
            <Badge variant={statusVariant} showIcon>
              {statusLabel}
            </Badge>
          </View>
        </View>
        <Text variant="body" style={styles.description} numberOfLines={2}>
          {descriptionLines}
        </Text>
        <View style={styles.dateRow}>
          <Feather name="clock" size={14} color={theme.colors.muted} />
          <Text variant="small" style={styles.date}>
            {formattedDate}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Feather name="dollar-sign" size={16} color={theme.colors.primary} />
          <Text variant="body" style={styles.amount}>
            Total: ${booking.totalAmount.toFixed(2)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    flexWrap: "wrap",
  },
  category: {
    flexShrink: 1,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  description: {
    marginBottom: theme.spacing[2],
    color: theme.colors.muted,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  date: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[1],
  },
  amount: {
    marginLeft: theme.spacing[1],
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

// Memoize component to prevent unnecessary re-renders
export const BookingCard = React.memo(
  BookingCardComponent,
  (prevProps, nextProps) => {
    // Only re-render if booking ID or status changes, or onPress reference changes
    return (
      prevProps.booking.id === nextProps.booking.id &&
      prevProps.booking.status === nextProps.booking.status &&
      prevProps.booking.isFirstBooking === nextProps.booking.isFirstBooking &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import type { Booking } from "@repo/domain";
import { BookingStatus, Category } from "@repo/domain";
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

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const categoryLabel = categoryLabels[booking.category] || booking.category;
  const statusLabel = statusLabels[booking.status];
  const statusVariant = statusVariants[booking.status];

  const formattedDate = new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(booking.scheduledAt));

  const descriptionLines = booking.description.split("\n").slice(0, 2).join("\n");

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text variant="h2" style={styles.category}>
            {categoryLabel}
          </Text>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </View>
        <Text variant="body" style={styles.description} numberOfLines={2}>
          {descriptionLines}
        </Text>
        <Text variant="small" style={styles.date}>
          {formattedDate}
        </Text>
        <Text variant="body" style={styles.amount}>
          Total: ${booking.totalAmount.toFixed(2)}
        </Text>
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
  category: {
    flex: 1,
  },
  description: {
    marginBottom: theme.spacing[2],
    color: theme.colors.muted,
  },
  date: {
    marginBottom: theme.spacing[1],
    color: theme.colors.muted,
  },
  amount: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

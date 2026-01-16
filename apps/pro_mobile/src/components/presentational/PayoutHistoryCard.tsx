import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";
import { Badge } from "@components/ui/Badge";
import { formatAmount, formatDateShort } from "../../utils/format";
import { theme } from "../../theme";

interface Payout {
  id: string;
  status: "CREATED" | "SENT" | "FAILED" | "SETTLED";
  amount: number;
  currency: string;
  createdAt: string | Date;
  sentAt?: string | Date | null;
  settledAt?: string | Date | null;
}

interface PayoutHistoryCardProps {
  payouts: Payout[];
  onViewAll?: () => void;
}

/**
 * Get status label and variant for payout
 */
function getPayoutStatus(status: Payout["status"]): { label: string; variant: "success" | "warning" | "danger" | "info" } {
  switch (status) {
    case "SETTLED":
      return { label: "Completado", variant: "success" };
    case "SENT":
      return { label: "Enviado", variant: "info" };
    case "FAILED":
      return { label: "Fallido", variant: "danger" };
    case "CREATED":
      return { label: "Creado", variant: "warning" };
    default:
      return { label: status, variant: "info" };
  }
}

export function PayoutHistoryCard({ payouts, onViewAll }: PayoutHistoryCardProps) {
  // Show last 3 payouts
  const displayPayouts = payouts.slice(0, 3);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Feather name="clock" size={20} color={theme.colors.primary} />
        <Text variant="h2" style={styles.title}>
          Historial de pagos
        </Text>
      </View>

      {displayPayouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={24} color={theme.colors.muted} />
          <Text variant="body" style={styles.emptyText}>
            Aún no tenés pagos registrados
          </Text>
        </View>
      ) : (
        <>
          {displayPayouts.map((payout) => {
            const { label, variant } = getPayoutStatus(payout.status);
            const displayDateRaw = payout.settledAt || payout.sentAt || payout.createdAt;
            const displayDate = displayDateRaw instanceof Date ? displayDateRaw : new Date(displayDateRaw);

            return (
              <View key={payout.id} style={styles.payoutRow}>
                <View style={styles.payoutLeft}>
                  <View style={styles.payoutDateRow}>
                    <Feather name="calendar" size={14} color={theme.colors.muted} />
                    <Text variant="small" style={styles.payoutDate}>
                      {formatDateShort(displayDate)}
                    </Text>
                  </View>
                  <Text variant="body" style={styles.payoutAmount}>
                    {formatAmount(payout.amount, payout.currency)}
                  </Text>
                </View>
                <Badge variant={variant}>
                  {label}
                </Badge>
              </View>
            );
          })}

          {payouts.length > 3 && onViewAll && (
            <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
              <Text variant="small" style={styles.viewAllText}>
                Ver todos los pagos
              </Text>
              <Feather name="chevron-right" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.text,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing[4],
  },
  emptyText: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
    textAlign: "center",
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payoutLeft: {
    flex: 1,
  },
  payoutDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[1],
  },
  payoutDate: {
    marginLeft: theme.spacing[1],
    color: theme.colors.muted,
  },
  payoutAmount: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  viewAllText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
    marginRight: theme.spacing[1],
  },
});

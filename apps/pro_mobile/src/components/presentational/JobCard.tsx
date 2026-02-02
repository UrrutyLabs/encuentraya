import React, { useMemo } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import type { Order } from "@repo/domain";
import { OrderStatus } from "@repo/domain";
import { getJobStatusLabel, getJobStatusVariant } from "../../utils/jobStatus";
import { JOB_LABELS } from "../../utils/jobLabels";
import { formatAmount } from "../../utils/format";
import { theme } from "../../theme";
import { useCategoryLookup } from "../../hooks/category/useCategoryLookup";

interface JobCardProps {
  job: Order;
  onPress: () => void;
  onChatPress?: (orderId: string) => void;
}

function JobCardComponent({ job, onPress, onChatPress }: JobCardProps) {
  // Fetch categories and get lookup function
  const { getCategoryName } = useCategoryLookup();

  // Memoize computed values to avoid recalculation on re-renders
  const categoryLabel = useMemo(() => {
    // First try to get category name from metadata (snapshot at order creation)
    const categoryNameFromMetadata = job.categoryMetadataJson?.name as
      | string
      | undefined;
    if (categoryNameFromMetadata) {
      return categoryNameFromMetadata;
    }
    // Fallback to fetching category name by ID
    return getCategoryName(job.categoryId);
  }, [job.categoryMetadataJson, job.categoryId, getCategoryName]);

  const statusLabel = useMemo(
    () => getJobStatusLabel(job.status),
    [job.status]
  );

  const statusVariant = useMemo(
    () => getJobStatusVariant(job.status),
    [job.status]
  );

  const quoteStatusLine = useMemo(() => {
    if (job.pricingMode !== "fixed" || job.status !== OrderStatus.ACCEPTED) {
      return null;
    }
    return (job.quotedAmountCents ?? 0) > 0
      ? "Presupuesto enviado"
      : "Enviar presupuesto";
  }, [job.pricingMode, job.status, job.quotedAmountCents]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("es-UY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(job.scheduledWindowStartAt)),
    [job.scheduledWindowStartAt]
  );

  const descriptionLines = useMemo(
    () => (job.description || "").split("\n").slice(0, 2).join("\n"),
    [job.description]
  );

  // Pro still needs to accept (pending_pro_confirmation) → show info banner
  const isPendingProConfirmation = useMemo(
    () => job.status === OrderStatus.PENDING_PRO_CONFIRMATION,
    [job.status]
  );

  // Accepted but not yet paid → show "don't start until paid" disclaimer
  const isAcceptedButNotPaid = useMemo(
    () =>
      [
        OrderStatus.ACCEPTED,
        OrderStatus.CONFIRMED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.AWAITING_CLIENT_APPROVAL,
        OrderStatus.DISPUTED,
        OrderStatus.COMPLETED,
      ].includes(job.status),
    [job.status]
  );

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={styles.categoryContainer}>
              <Text variant="h2" style={styles.category}>
                {categoryLabel}
              </Text>
              {job.displayId && (
                <Text variant="small" style={styles.displayId}>
                  {JOB_LABELS.jobNumber} #{job.displayId}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.badgesContainer}>
            <Badge variant={statusVariant} showIcon>
              {statusLabel}
            </Badge>
            {quoteStatusLine ? (
              <Text variant="small" style={styles.quoteStatusLine}>
                {quoteStatusLine}
              </Text>
            ) : null}
            {job.isFirstOrder && job.status !== OrderStatus.COMPLETED && (
              <Badge variant="new">Nuevo Cliente</Badge>
            )}
          </View>
        </View>
        {job.description && (
          <Text variant="body" style={styles.description} numberOfLines={2}>
            {descriptionLines}
          </Text>
        )}
        <View style={styles.dateRow}>
          <Feather name="clock" size={14} color={theme.colors.muted} />
          <Text variant="small" style={styles.date}>
            {formattedDate}
          </Text>
        </View>
        {isPendingProConfirmation && (
          <Alert
            variant="info"
            message="Podés chatear con el cliente para entender mejor el trabajo antes de aceptar."
          />
        )}
        {isAcceptedButNotPaid && (
          <Alert
            variant="warning"
            message="El pago aún está siendo confirmado. No inicies el trabajo hasta que recibas la confirmación."
          />
        )}
        {job.totalAmount && (
          <View style={styles.amountRow}>
            <Feather
              name="dollar-sign"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="body" style={styles.amount}>
              {JOB_LABELS.totalAmount}:{" "}
              {formatAmount(job.totalAmount, job.currency)}
            </Text>
          </View>
        )}
        {job.proProfileId && onChatPress && (
          <TouchableOpacity
            style={styles.mensajesRow}
            onPress={() => onChatPress(job.id)}
            activeOpacity={0.7}
          >
            <Feather
              name="message-circle"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="body" style={styles.mensajesText}>
              Mensajes
            </Text>
          </TouchableOpacity>
        )}
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
    alignItems: "flex-start",
    marginBottom: theme.spacing[2],
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    flexWrap: "wrap",
  },
  categoryContainer: {
    flexShrink: 1,
  },
  category: {
    flexShrink: 1,
  },
  displayId: {
    marginTop: 2,
    color: theme.colors.muted,
  },
  badgesContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing[2],
  },
  quoteStatusLine: {
    color: theme.colors.muted,
    marginTop: -theme.spacing[1],
  },
  description: {
    marginBottom: theme.spacing[2],
    color: theme.colors.muted,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
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
  mensajesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    marginTop: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignSelf: "flex-start",
  },
  mensajesText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});

// Memoize component to prevent unnecessary re-renders
export const JobCard = React.memo(JobCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.status === nextProps.job.status &&
    prevProps.job.pricingMode === nextProps.job.pricingMode &&
    prevProps.job.quotedAmountCents === nextProps.job.quotedAmountCents &&
    prevProps.job.isFirstOrder === nextProps.job.isFirstOrder &&
    prevProps.job.proProfileId === nextProps.job.proProfileId &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.onChatPress === nextProps.onChatPress
  );
});

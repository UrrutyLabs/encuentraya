import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { JobDetailSkeleton } from "@components/presentational/JobDetailSkeleton";
import { useOrderActions, useOrderDetail } from "@hooks/order";
import { OrderStatus } from "@repo/domain";
import { getJobStatusLabel, getJobStatusVariant } from "../../utils/jobStatus";
import { JOB_LABELS } from "../../utils/jobLabels";
import { formatAmount } from "../../utils/format";
import { theme } from "../../theme";
import { useCategoryLookup } from "../../hooks/category/useCategoryLookup";

export function JobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  // Fetch order by id via hook (using jobId from route, but orderId for API)
  const orderId = jobId; // Route uses jobId, but API uses orderId
  const { order, isLoading, error, refetch } = useOrderDetail(orderId);

  const {
    acceptOrder,
    rejectOrder,
    markOnMyWay,
    arriveOrder,
    completeOrder,
    isAccepting,
    isRejecting,
    isMarkingOnMyWay,
    isArriving,
    isCompleting,
    error: actionError,
  } = useOrderActions(() => {
    // Refetch order data after successful action
    refetch();
  });

  // Use local status if set, otherwise use order status
  const displayStatus: OrderStatus | null =
    localStatus || (order?.status as OrderStatus) || null;

  // Memoize handlers to prevent unnecessary re-renders
  // Must be called before early returns (React Rules of Hooks)
  const handleAccept = useCallback(async () => {
    if (!orderId) return;
    try {
      await acceptOrder(orderId);
      setLocalStatus(OrderStatus.ACCEPTED);
    } catch {
      // Error handled by hook
    }
  }, [orderId, acceptOrder]);

  const handleReject = useCallback(async () => {
    if (!orderId) return;
    try {
      await rejectOrder(orderId, "Rechazado por el profesional");
      setLocalStatus(OrderStatus.CANCELED);
    } catch {
      // Error handled by hook
    }
  }, [orderId, rejectOrder]);

  const handleMarkOnMyWay = useCallback(async () => {
    if (!orderId) return;
    try {
      await markOnMyWay(orderId);
      setLocalStatus(OrderStatus.IN_PROGRESS);
    } catch {
      // Error handled by hook
    }
  }, [orderId, markOnMyWay]);

  const handleArrive = useCallback(async () => {
    if (!orderId) return;
    try {
      await arriveOrder(orderId);
      // markArrived doesn't change status, just sets arrivedAt
      // Status remains IN_PROGRESS
    } catch {
      // Error handled by hook
    }
  }, [orderId, arriveOrder]);

  const handleComplete = useCallback(async () => {
    if (!orderId || !order) return;
    try {
      // submitHours requires finalHours - use estimatedHours as default
      const finalHours = order.finalHoursSubmitted || order.estimatedHours;
      await completeOrder(orderId, finalHours);
      setLocalStatus(OrderStatus.AWAITING_CLIENT_APPROVAL);
    } catch {
      // Error handled by hook
    }
  }, [orderId, order, completeOrder]);

  // Memoize computed values (must be before early returns)
  const statusLabel = useMemo(
    () => (displayStatus ? getJobStatusLabel(displayStatus) : ""),
    [displayStatus]
  );

  const statusVariant = useMemo(
    () => (displayStatus ? getJobStatusVariant(displayStatus) : "info"),
    [displayStatus]
  );

  // Fetch categories for lookup
  const { getCategoryName, categoryMap } = useCategoryLookup();

  const categoryLabel = useMemo(() => {
    if (!order) return "";
    // First try to get category name from metadata (snapshot at order creation)
    const categoryNameFromMetadata = order.categoryMetadataJson?.name as
      | string
      | undefined;
    if (categoryNameFromMetadata) {
      return categoryNameFromMetadata;
    }
    // Fallback to fetching category name by ID
    return getCategoryName(order.categoryId);
  }, [order, getCategoryName]);

  // Extract and format quick question answers
  const quickQuestionAnswers = useMemo(() => {
    if (!order?.categoryMetadataJson) return [];

    const metadata = order.categoryMetadataJson as Record<string, unknown>;
    const answers = metadata.quickQuestionAnswers as
      | Record<string, unknown>
      | undefined;

    if (!answers || Object.keys(answers).length === 0) return [];

    // Get category config to find question labels
    const category = categoryMap.get(order.categoryId);
    const configJson = category?.configJson as
      | { quick_questions?: { key: string; label: string; type: string }[] }
      | undefined;
    const questions = configJson?.quick_questions || [];

    // Format answers with labels
    return questions
      .filter((q) => answers[q.key] !== undefined && answers[q.key] !== null)
      .map((q) => {
        const value = answers[q.key];
        let formattedValue: string;

        if (value === true || value === "true") {
          formattedValue = "Sí";
        } else if (value === false || value === "false") {
          formattedValue = "No";
        } else if (Array.isArray(value)) {
          formattedValue = value.join(", ");
        } else if (typeof value === "number") {
          formattedValue = String(value);
        } else {
          formattedValue = String(value || "");
        }

        return {
          label: q.label,
          value: formattedValue,
        };
      });
  }, [order, categoryMap]);

  const formattedDate = useMemo(
    () =>
      order
        ? new Intl.DateTimeFormat("es-UY", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(order.scheduledWindowStartAt))
        : "",
    [order]
  );

  // Pro still needs to accept (pending_pro_confirmation) → show info banner
  // Must be before early returns (React Rules of Hooks)
  const isPendingProConfirmation = useMemo(
    () => displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION,
    [displayStatus]
  );

  // Accepted but not yet paid → show "don't start until paid" disclaimer
  const isAcceptedButNotPaid = useMemo(
    () =>
      displayStatus !== null &&
      [
        OrderStatus.ACCEPTED,
        OrderStatus.CONFIRMED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.AWAITING_CLIENT_APPROVAL,
        OrderStatus.DISPUTED,
        OrderStatus.COMPLETED,
      ].includes(displayStatus),
    [displayStatus]
  );

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={theme.colors.danger} />
        <Text variant="body" style={styles.error}>
          {error?.message || "Trabajo no encontrado"}
        </Text>
      </View>
    );
  }

  const canAccept = displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION;
  const canReject = displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION;
  const canMarkOnMyWay = displayStatus === OrderStatus.CONFIRMED;
  const canArrive =
    displayStatus === OrderStatus.IN_PROGRESS && !order.arrivedAt;
  const canComplete =
    displayStatus === OrderStatus.IN_PROGRESS && !!order.arrivedAt;
  const isReadOnly =
    displayStatus === OrderStatus.COMPLETED ||
    displayStatus === OrderStatus.CANCELED ||
    displayStatus === OrderStatus.PAID ||
    displayStatus === OrderStatus.AWAITING_CLIENT_APPROVAL ||
    displayStatus === OrderStatus.DISPUTED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">{JOB_LABELS.jobDetails}</Text>
        <Badge variant={statusVariant} showIcon>
          {statusLabel}
        </Badge>
      </View>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Feather name="file-text" size={20} color={theme.colors.primary} />
            <Text variant="h2" style={styles.sectionTitle}>
              Resumen
            </Text>
          </View>
          {order.isFirstOrder && <Badge variant="new">Nuevo Cliente</Badge>}
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="hash" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              {JOB_LABELS.jobNumber}:
            </Text>
          </View>
          <Text variant="body">#{order.displayId}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="tag" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              {JOB_LABELS.category}:
            </Text>
          </View>
          <Text variant="body">{categoryLabel}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="calendar" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              {JOB_LABELS.scheduledDate} y {JOB_LABELS.scheduledTime}:
            </Text>
          </View>
          <Text variant="body">{formattedDate}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <Feather name="clock" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              {JOB_LABELS.estimatedHours}:
            </Text>
          </View>
          <Text variant="body">{order.estimatedHours}</Text>
        </View>
        {order.description && (
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Feather name="file-text" size={14} color={theme.colors.muted} />
              <Text variant="small" style={styles.label}>
                {JOB_LABELS.description}:
              </Text>
            </View>
            <Text variant="body" style={styles.description}>
              {order.description}
            </Text>
          </View>
        )}
        {quickQuestionAnswers.length > 0 && (
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Feather
                name="help-circle"
                size={14}
                color={theme.colors.muted}
              />
              <Text variant="small" style={styles.label}>
                Detalles adicionales:
              </Text>
            </View>
            <View style={styles.quickAnswersContainer}>
              {quickQuestionAnswers.map((qa, index) => (
                <View key={index} style={styles.quickAnswerRow}>
                  <Text variant="small" style={styles.quickAnswerLabel}>
                    {qa.label}:
                  </Text>
                  <Text variant="body" style={styles.quickAnswerValue}>
                    {qa.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {isPendingProConfirmation && (
          <Alert
            variant="info"
            title="Podés chatear con el cliente"
            message="Antes de aceptar, podés usar Mensajes para entender mejor el trabajo y resolver dudas."
            showBorder
            style={styles.paymentAlert}
          />
        )}
        {isAcceptedButNotPaid && (
          <Alert
            variant="warning"
            title="Pago pendiente de confirmación"
            message="El pago de este trabajo aún está siendo confirmado. Por favor, no inicies el trabajo hasta que recibas la confirmación del pago."
            showBorder
            style={styles.paymentAlert}
          />
        )}
        {order.totalAmount && (
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <Feather
                name="dollar-sign"
                size={14}
                color={theme.colors.muted}
              />
              <Text variant="small" style={styles.label}>
                {JOB_LABELS.totalAmount} estimado:
              </Text>
            </View>
            <Text variant="h2" style={styles.amount}>
              {formatAmount(order.totalAmount, order.currency)}
            </Text>
          </View>
        )}
      </Card>

      {/* Mensajes CTA */}
      {orderId && (
        <Card style={styles.chatCard}>
          <TouchableOpacity
            style={styles.chatCta}
            onPress={() => router.push(`/job/${orderId}/chat` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.chatCtaLeft}>
              <Feather
                name="message-circle"
                size={22}
                color={theme.colors.primary}
              />
              <Text variant="h2" style={styles.chatCtaText}>
                Mensajes
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.colors.muted}
            />
          </TouchableOpacity>
        </Card>
      )}

      {/* Actions */}
      {actionError && (
        <Card style={styles.errorCard}>
          <View style={styles.errorRow}>
            <Feather
              name="alert-circle"
              size={16}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.errorText}>
              {actionError}
            </Text>
          </View>
        </Card>
      )}

      {!isReadOnly && (
        <Card style={styles.actionsCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Feather name="zap" size={20} color={theme.colors.primary} />
              <Text variant="h2" style={styles.sectionTitle}>
                Acciones
              </Text>
            </View>
          </View>

          {canAccept && (
            <Button
              variant="primary"
              onPress={handleAccept}
              disabled={isAccepting || isRejecting}
              style={styles.actionButton}
            >
              {isAccepting ? "Aceptando..." : JOB_LABELS.acceptJob}
            </Button>
          )}

          {canReject && (
            <Button
              variant="danger"
              onPress={handleReject}
              disabled={isAccepting || isRejecting}
              style={styles.actionButton}
            >
              {isRejecting ? "Rechazando..." : JOB_LABELS.rejectJob}
            </Button>
          )}

          {canMarkOnMyWay && (
            <Button
              variant="primary"
              onPress={handleMarkOnMyWay}
              disabled={isMarkingOnMyWay}
              style={styles.actionButton}
            >
              {isMarkingOnMyWay ? "Marcando..." : JOB_LABELS.markOnMyWay}
            </Button>
          )}

          {canArrive && (
            <Button
              variant="primary"
              onPress={handleArrive}
              disabled={isArriving}
              style={styles.actionButton}
            >
              {isArriving ? "Marcando..." : JOB_LABELS.markArrived}
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              onPress={handleComplete}
              disabled={isCompleting}
              style={styles.actionButton}
            >
              {isCompleting ? "Completando..." : JOB_LABELS.completeJob}
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
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    flexWrap: "wrap",
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  chatCard: {
    marginBottom: theme.spacing[4],
  },
  chatCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
  },
  chatCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  chatCtaText: {
    color: theme.colors.text,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing[3],
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
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
  quickAnswersContainer: {
    marginTop: theme.spacing[1],
  },
  quickAnswerRow: {
    marginBottom: theme.spacing[2],
  },
  quickAnswerLabel: {
    color: theme.colors.muted,
    marginBottom: 2,
    fontWeight: theme.typography.weights.medium,
  },
  quickAnswerValue: {
    color: theme.colors.text,
  },
  paymentAlert: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[3],
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

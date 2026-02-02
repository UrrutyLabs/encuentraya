import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Alert } from "@components/ui/Alert";
import type { Order } from "@repo/domain";
import { JOB_LABELS } from "../../../utils/jobLabels";
import { formatAmount } from "../../../utils/format";
import { theme } from "../../../theme";

export interface QuickQuestionAnswer {
  label: string;
  value: string;
}

interface JobDetailSummaryProps {
  order: Order;
  categoryLabel: string;
  formattedDate: string;
  quickQuestionAnswers: QuickQuestionAnswer[];
  isPendingProConfirmation: boolean;
  isAcceptedButNotPaid: boolean;
}

export function JobDetailSummary({
  order,
  categoryLabel,
  formattedDate,
  quickQuestionAnswers,
  isPendingProConfirmation,
  isAcceptedButNotPaid,
}: JobDetailSummaryProps) {
  return (
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
            <Feather name="help-circle" size={14} color={theme.colors.muted} />
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
            <Feather name="dollar-sign" size={14} color={theme.colors.muted} />
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
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[4],
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
});

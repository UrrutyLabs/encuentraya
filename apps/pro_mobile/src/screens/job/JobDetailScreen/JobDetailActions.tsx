import { View, StyleSheet, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import type { Order } from "@repo/domain";
import { JOB_LABELS } from "../../../utils/jobLabels";
import { formatAmount } from "../../../utils/format";
import { theme } from "../../../theme";

interface JobDetailActionsProps {
  order: Order;
  // Quote form
  quoteAmount: string;
  quoteMessage: string;
  quoteError: string;
  onQuoteAmountChange: (text: string) => void;
  onQuoteMessageChange: (text: string) => void;
  onSubmitQuote: () => Promise<void>;
  isSubmittingQuote: boolean;
  showSendQuoteForm: boolean;
  showQuoteSent: boolean;
  // Action buttons
  canAccept: boolean;
  canReject: boolean;
  canMarkOnMyWay: boolean;
  canArrive: boolean;
  canComplete: boolean;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onMarkOnMyWay: () => Promise<void>;
  onArrive: () => Promise<void>;
  onComplete: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
  isMarkingOnMyWay: boolean;
  isArriving: boolean;
  isCompleting: boolean;
  isSubmittingCompletion: boolean;
}

export function JobDetailActions({
  order,
  quoteAmount,
  quoteMessage,
  quoteError,
  onQuoteAmountChange,
  onQuoteMessageChange,
  onSubmitQuote,
  isSubmittingQuote,
  showSendQuoteForm,
  showQuoteSent,
  canAccept,
  canReject,
  canMarkOnMyWay,
  canArrive,
  canComplete,
  onAccept,
  onReject,
  onMarkOnMyWay,
  onArrive,
  onComplete,
  isAccepting,
  isRejecting,
  isMarkingOnMyWay,
  isArriving,
  isCompleting,
  isSubmittingCompletion,
}: JobDetailActionsProps) {
  const isFixedOrder = order.pricingMode === "fixed";

  return (
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
          onPress={onAccept}
          disabled={isAccepting || isRejecting}
          style={styles.actionButton}
        >
          {isAccepting ? "Aceptando..." : JOB_LABELS.acceptJob}
        </Button>
      )}

      {canReject && (
        <Button
          variant="danger"
          onPress={onReject}
          disabled={isAccepting || isRejecting}
          style={styles.actionButton}
        >
          {isRejecting ? "Rechazando..." : JOB_LABELS.rejectJob}
        </Button>
      )}

      {showSendQuoteForm && (
        <Card style={styles.quoteCard}>
          <Text variant="h2" style={styles.quoteSectionTitle}>
            Enviar presupuesto
          </Text>
          <Input
            label="Monto (UYU) *"
            icon="dollar-sign"
            value={quoteAmount}
            onChangeText={(text) => {
              onQuoteAmountChange(text.replace(/[^0-9.]/g, ""));
            }}
            placeholder="Ej: 5000"
            keyboardType="numeric"
            style={styles.quoteInput}
          />
          <View style={styles.quoteMessageRow}>
            <Text variant="small" style={styles.quoteLabel}>
              Mensaje (opcional)
            </Text>
            <TextInput
              style={styles.quoteMessageInput}
              placeholder="Mensaje para el cliente..."
              placeholderTextColor={theme.colors.muted}
              value={quoteMessage}
              onChangeText={onQuoteMessageChange}
              multiline
              numberOfLines={2}
            />
          </View>
          {quoteError ? (
            <View style={styles.quoteErrorRow}>
              <Feather
                name="alert-circle"
                size={14}
                color={theme.colors.danger}
              />
              <Text variant="small" style={styles.quoteError}>
                {quoteError}
              </Text>
            </View>
          ) : null}
          <Button
            variant="primary"
            onPress={onSubmitQuote}
            disabled={isSubmittingQuote}
            style={styles.actionButton}
          >
            {isSubmittingQuote ? "Enviando..." : "Enviar presupuesto"}
          </Button>
        </Card>
      )}

      {showQuoteSent && (
        <View style={styles.quoteSentBlock}>
          <Text variant="body" style={styles.quoteSentText}>
            Presupuesto enviado. Esperando aceptación del cliente.
          </Text>
          {order.quotedAmountCents != null && order.quotedAmountCents > 0 && (
            <Text variant="body" style={styles.quoteSentAmount}>
              Monto: {formatAmount(order.quotedAmountCents, order.currency)}
            </Text>
          )}
        </View>
      )}

      {canMarkOnMyWay && (
        <Button
          variant="primary"
          onPress={onMarkOnMyWay}
          disabled={isMarkingOnMyWay}
          style={styles.actionButton}
        >
          {isMarkingOnMyWay ? "Marcando..." : JOB_LABELS.markOnMyWay}
        </Button>
      )}

      {canArrive && (
        <Button
          variant="primary"
          onPress={onArrive}
          disabled={isArriving}
          style={styles.actionButton}
        >
          {isArriving ? "Marcando..." : JOB_LABELS.markArrived}
        </Button>
      )}

      {canComplete && (
        <Button
          variant="primary"
          onPress={onComplete}
          disabled={isCompleting || isSubmittingCompletion}
          style={styles.actionButton}
        >
          {isCompleting || isSubmittingCompletion
            ? "Completando..."
            : JOB_LABELS.completeJob}
        </Button>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
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
  actionButton: {
    marginBottom: theme.spacing[2],
  },
  quoteCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
  },
  quoteSectionTitle: {
    marginBottom: theme.spacing[3],
  },
  quoteInput: {
    marginBottom: theme.spacing[3],
  },
  quoteMessageRow: {
    marginBottom: theme.spacing[3],
  },
  quoteLabel: {
    marginBottom: theme.spacing[1],
    color: theme.colors.muted,
  },
  quoteMessageInput: {
    minHeight: 60,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  quoteErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  quoteError: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
  quoteSentBlock: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: `${theme.colors.primary}0D`,
    borderRadius: theme.radius.md,
  },
  quoteSentText: {
    marginBottom: theme.spacing[1],
  },
  quoteSentAmount: {
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});

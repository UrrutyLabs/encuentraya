import { useState, useEffect, useCallback } from "react";
import { StyleSheet, ScrollView, Alert, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { Input } from "@components/ui/Input";
import { PayoutInfoSkeleton } from "@components/presentational/PayoutInfoSkeleton";
import { FinancialSummaryCard } from "@components/presentational/FinancialSummaryCard";
import { FinancialSummaryCardSkeleton } from "@components/presentational/FinancialSummaryCardSkeleton";
import { NextPayoutCard } from "@components/presentational/NextPayoutCard";
import { NextPayoutCardSkeleton } from "@components/presentational/NextPayoutCardSkeleton";
import { PayoutHistoryCard } from "@components/presentational/PayoutHistoryCard";
import { PayoutHistoryCardSkeleton } from "@components/presentational/PayoutHistoryCardSkeleton";
import { ErrorCard } from "@components/presentational/ErrorCard";
import { usePayoutProfile, usePayoutSummary, usePayouts, useUpdatePayoutProfile } from "@hooks/payout";
import { theme } from "../../theme";

export function PayoutInfoScreen() {
  const [fullName, setFullName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [documentId, setDocumentId] = useState("");

  // Fetch current payout profile
  const { data: profile, isLoading } = usePayoutProfile();

  // Fetch financial summary
  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = usePayoutSummary();

  // Fetch recent payouts
  const {
    data: payouts,
    isLoading: isLoadingPayouts,
    error: payoutsError,
    refetch: refetchPayouts,
  } = usePayouts({ limit: 5 });

  // Retry handlers (must be before early returns)
  const handleRetrySummary = useCallback(() => {
    refetchSummary();
  }, [refetchSummary]);

  const handleRetryPayouts = useCallback(() => {
    refetchPayouts();
  }, [refetchPayouts]);

  // Initialize form values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setBankAccountNumber(profile.bankAccountNumber || "");
      setBankName(profile.bankName || "");
      setDocumentId(profile.documentId || "");
    }
  }, [profile]);

  // Update mutation
  const updateMutation = useUpdatePayoutProfile();

  const handleSave = () => {
    updateMutation.mutate(
      {
        fullName: fullName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankName: bankName || null,
        documentId: documentId || null,
      },
      {
        onSuccess: () => {
          Alert.alert("Guardado", "Tus datos de cobro fueron guardados correctamente.");
        },
        onError: (error) => {
          Alert.alert("Error", error.message || "No se pudieron guardar los datos. Por favor, intentá nuevamente.");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <PayoutInfoSkeleton />
      </ScrollView>
    );
  }

  const isComplete = profile?.isComplete ?? false;

  // Determine next payout status
  const getNextPayoutStatus = (): "available" | "pending" | "no_data" => {
    if (!isComplete) return "no_data";
    if (summary && summary.availableAmount > 0) return "available";
    if (summary && summary.pendingAmount > 0) return "pending";
    return "no_data";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Feather name="credit-card" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Cobros
        </Text>
      </View>

      {/* Financial Summary Card */}
      {isLoadingSummary ? (
        <FinancialSummaryCardSkeleton />
      ) : summaryError ? (
        <ErrorCard
          title="Error al cargar resumen"
          message={summaryError?.message || "No se pudo cargar el resumen financiero"}
          onRetry={handleRetrySummary}
        />
      ) : summary ? (
        <FinancialSummaryCard
          available={summary.availableAmount}
          pending={summary.pendingAmount}
          totalPaid={summary.totalPaidAmount}
          currency={summary.currency}
        />
      ) : null}

      {/* Next Payout Card */}
      {isLoadingSummary ? (
        <NextPayoutCardSkeleton />
      ) : summaryError ? null : summary ? (
        <NextPayoutCard
          amount={summary.availableAmount > 0 ? summary.availableAmount : summary.pendingAmount}
          currency={summary.currency}
          status={getNextPayoutStatus()}
        />
      ) : null}

      {/* Payout History Card */}
      {isLoadingPayouts ? (
        <PayoutHistoryCardSkeleton />
      ) : payoutsError ? (
        <ErrorCard
          title="Error al cargar historial"
          message={payoutsError?.message || "No se pudo cargar el historial de pagos"}
          onRetry={handleRetryPayouts}
        />
      ) : payouts ? (
        <PayoutHistoryCard payouts={payouts} />
      ) : null}

      {/* Form Fields */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="credit-card" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Información bancaria
          </Text>
        </View>

        <Input
          label="Nombre completo"
          icon="user"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ingresá tu nombre completo"
          style={styles.input}
        />

        <Input
          label="Cuenta bancaria"
          icon="credit-card"
          value={bankAccountNumber}
          onChangeText={setBankAccountNumber}
          placeholder="Ingresá tu número de cuenta"
          style={styles.input}
          keyboardType="numeric"
        />

        <Input
          label="Banco (opcional)"
          value={bankName}
          onChangeText={setBankName}
          placeholder="Ingresá el nombre del banco"
          style={styles.input}
        />

        <Input
          label="Documento (opcional)"
          icon="file-text"
          value={documentId}
          onChangeText={setDocumentId}
          placeholder="Ingresá tu documento"
          style={styles.input}
        />
      </Card>

      {/* Save Button */}
      <Button
        onPress={handleSave}
        disabled={updateMutation.isPending}
        style={styles.saveButton}
      >
        {updateMutation.isPending ? "Guardando..." : "Guardar"}
      </Button>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[6],
  },
  title: {
    marginLeft: theme.spacing[2],
    color: theme.colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[4],
  },
  loadingText: {
    marginTop: theme.spacing[2],
    color: theme.colors.muted,
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
    color: theme.colors.text,
  },
  input: {
    marginBottom: theme.spacing[3],
  },
  saveButton: {
    width: "100%",
    marginTop: theme.spacing[2],
  },
});

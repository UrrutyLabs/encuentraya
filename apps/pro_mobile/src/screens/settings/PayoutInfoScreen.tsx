import { useState, useEffect } from "react";
import { StyleSheet, ScrollView, Alert, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import { Input } from "../../components/ui/Input";
import { PayoutInfoSkeleton } from "../../components/presentational/PayoutInfoSkeleton";
import { trpc } from "../../lib/trpc/client";
import { theme } from "../../theme";

export function PayoutInfoScreen() {
  const [fullName, setFullName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [documentId, setDocumentId] = useState("");

  // Fetch current payout profile
  const { data: profile, isLoading } = trpc.proPayout.getMine.useQuery(undefined, {
    retry: false,
  });

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
  const updateMutation = trpc.proPayout.updateMine.useMutation({
    onSuccess: () => {
      Alert.alert("Guardado", "Tus datos de cobro fueron guardados correctamente.");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "No se pudieron guardar los datos. Por favor, intentá nuevamente.");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      fullName: fullName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankName: bankName || null,
      documentId: documentId || null,
    });
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <PayoutInfoSkeleton />
      </ScrollView>
    );
  }

  const isComplete = profile?.isComplete ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Feather name="credit-card" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Cobros
        </Text>
      </View>

      {/* Status Card */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Estado
          </Text>
        </View>
        {isComplete ? (
          <View style={styles.statusRow}>
            <Feather name="check-circle" size={20} color={theme.colors.success} />
            <Text variant="body" style={styles.successText}>
              Datos completos
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <Feather name="alert-circle" size={20} color={theme.colors.warning} />
            <Text variant="body" style={styles.warningText}>
              Completá tus datos para poder cobrar
            </Text>
          </View>
        )}
      </Card>

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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  successText: {
    marginLeft: theme.spacing[2],
    color: theme.colors.success,
  },
  warningText: {
    marginLeft: theme.spacing[2],
    color: theme.colors.warning,
  },
  input: {
    marginBottom: theme.spacing[3],
  },
  saveButton: {
    width: "100%",
    marginTop: theme.spacing[2],
  },
});

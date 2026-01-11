import { useState } from "react";
import { StyleSheet, ScrollView, ActivityIndicator, View } from "react-native";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Text } from "../../components/ui/Text";
import { CategorySelector } from "../../components/presentational/CategorySelector";
import { theme } from "../../theme";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useAuth } from "../../hooks/useAuth";
import { Category } from "@repo/domain";
import { supabase } from "../../lib/supabase/client";

export function OnboardingScreen() {
  const { session, loading: sessionLoading } = useAuth();
  const { submitOnboarding, isLoading, error } = useOnboarding();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [serviceArea, setServiceArea] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }

    const hourlyRateNum = parseFloat(hourlyRate);
    if (!hourlyRate.trim()) {
      newErrors.hourlyRate = "La tarifa por hora es requerida";
    } else if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      newErrors.hourlyRate = "La tarifa debe ser un número mayor a 0";
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = "Seleccioná al menos una categoría";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Wait for session to be ready if still loading
    if (sessionLoading) {
      setErrors({ submit: "Esperando sesión..." });
      return;
    }

    // Get fresh session to ensure we have the latest
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.user?.email) {
      setErrors({ submit: "No se encontró la sesión. Por favor, iniciá sesión nuevamente." });
      return;
    }

    try {
      await submitOnboarding({
        name: name.trim(),
        email: currentSession.user.email,
        phone: phone.trim() || undefined,
        hourlyRate: parseFloat(hourlyRate),
        categories: selectedCategories,
        serviceArea: serviceArea.trim() || undefined,
      });
    } catch (err) {
      // Error is handled by useOnboarding hook
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Text variant="h1" style={styles.title}>
          Completar perfil
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Completá tu perfil para comenzar a recibir trabajos
        </Text>

        <Input
          label="Nombre completo *"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) {
              setErrors({ ...errors, name: "" });
            }
          }}
          placeholder="Ej: Juan Pérez"
          autoCapitalize="words"
          style={styles.input}
        />
        {errors.name && (
          <Text variant="small" style={styles.error}>
            {errors.name}
          </Text>
        )}

        <Input
          label="Teléfono *"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (errors.phone) {
              setErrors({ ...errors, phone: "" });
            }
          }}
          placeholder="Ej: 099123456"
          keyboardType="phone-pad"
          style={styles.input}
        />
        {errors.phone && (
          <Text variant="small" style={styles.error}>
            {errors.phone}
          </Text>
        )}

        <Input
          label="Tarifa por hora (UYU) *"
          value={hourlyRate}
          onChangeText={(text) => {
            setHourlyRate(text);
            if (errors.hourlyRate) {
              setErrors({ ...errors, hourlyRate: "" });
            }
          }}
          placeholder="Ej: 1000"
          keyboardType="numeric"
          style={styles.input}
        />
        {errors.hourlyRate && (
          <Text variant="small" style={styles.error}>
            {errors.hourlyRate}
          </Text>
        )}

        <CategorySelector
          selected={selectedCategories}
          onSelectionChange={(categories) => {
            setSelectedCategories(categories);
            if (errors.categories) {
              setErrors({ ...errors, categories: "" });
            }
          }}
        />
        {errors.categories && (
          <Text variant="small" style={styles.error}>
            {errors.categories}
          </Text>
        )}

        <Input
          label="Zona de servicio (opcional)"
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="Ej: Montevideo, Centro"
          autoCapitalize="words"
          style={styles.input}
        />

        {(error || errors.submit) && (
          <Text variant="small" style={styles.error}>
            {error || errors.submit}
          </Text>
        )}

        {(isLoading || sessionLoading) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={isLoading || sessionLoading || !session?.user?.email}
            style={styles.button}
          >
            Completar perfil
          </Button>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  title: {
    marginBottom: theme.spacing[2],
    textAlign: "center",
  },
  subtitle: {
    marginBottom: theme.spacing[6],
    textAlign: "center",
    color: theme.colors.muted,
  },
  input: {
    marginBottom: theme.spacing[2],
  },
  button: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing[2],
    marginTop: -theme.spacing[1],
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[4],
  },
});

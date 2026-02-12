import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { CategorySelector } from "@components/presentational/CategorySelector";
import { theme } from "../../theme";
import { useOnboarding, useAuth } from "@hooks/auth";
import { useAddressSuggestions } from "@hooks/location";
import { Category, toMinorUnits } from "@repo/domain";
import { CategoryRatesEditor } from "@components/presentational/CategoryRatesEditor";
import { supabase } from "@lib/supabase/client";
import { trpc } from "@lib/trpc/client";

const RADIUS_OPTIONS_KM = [5, 10, 15, 25, 50] as const;
const DEFAULT_RADIUS_KM = 10;

export function OnboardingScreen() {
  const { session, loading: sessionLoading } = useAuth();
  const { submitOnboarding, isLoading, error } = useOnboarding();

  // Fetch categories from API
  const { data: categories = [], isLoading: isLoadingCategories } =
    trpc.category.getAll.useQuery();

  const RATE_MAX_MAJOR = 999999;

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  /** Display value per categoryId (major units as string) */
  const [categoryRates, setCategoryRates] = useState<Record<string, string>>(
    {}
  );
  const [baseAddress, setBaseAddress] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const addressSuggestions = useAddressSuggestions(
    showAddressSuggestions ? baseAddress : ""
  );

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

    if (selectedCategories.length === 0) {
      newErrors.categories = "Seleccioná al menos una categoría";
    }

    for (const cat of selectedCategories) {
      const raw = categoryRates[cat.id] ?? "";
      const num = parseFloat(raw);
      if (!raw.trim()) {
        newErrors[cat.id] =
          cat.pricingMode === "fixed"
            ? "El precio desde es requerido"
            : "La tarifa por hora es requerida";
      } else if (isNaN(num) || num <= 0) {
        newErrors[cat.id] = "Debe ser un número mayor a 0";
      } else if (num > RATE_MAX_MAJOR) {
        newErrors[cat.id] = `Máximo ${RATE_MAX_MAJOR}`;
      }
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
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession?.user?.email) {
      setErrors({
        submit:
          "No se encontró la sesión. Por favor, iniciá sesión nuevamente.",
      });
      return;
    }

    const categoryRatesPayload = selectedCategories.map((cat) => {
      const raw = categoryRates[cat.id] ?? "";
      const major = parseFloat(raw);
      const minor = toMinorUnits(major);
      if (cat.pricingMode === "fixed") {
        return { categoryId: cat.id, startingFromCents: minor };
      }
      return { categoryId: cat.id, hourlyRateCents: minor };
    });

    const firstHourlyCategory = selectedCategories.find(
      (c) => c.pricingMode !== "fixed"
    );
    const hourlyRateForApi =
      firstHourlyCategory &&
      (categoryRates[firstHourlyCategory.id] ?? "").trim()
        ? toMinorUnits(parseFloat(categoryRates[firstHourlyCategory.id]))
        : 1;

    try {
      await submitOnboarding({
        name: name.trim(),
        email: currentSession.user.email,
        phone: phone.trim() || undefined,
        hourlyRate: hourlyRateForApi,
        categoryRates: categoryRatesPayload,
        baseAddress: baseAddress.trim() || undefined,
        serviceRadiusKm,
      });
    } catch {
      // Error is handled by useOnboarding hook
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Feather name="user-plus" size={24} color={theme.colors.primary} />
          <Text variant="h1" style={styles.title}>
            Completar perfil
          </Text>
        </View>
        <Text variant="body" style={styles.subtitle}>
          Completá tu perfil para comenzar a recibir trabajos
        </Text>

        <Input
          label="Nombre completo *"
          icon="user"
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
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={14}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {errors.name}
            </Text>
          </View>
        )}

        <Input
          label="Teléfono *"
          icon="phone"
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
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={14}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {errors.phone}
            </Text>
          </View>
        )}

        <CategorySelector
          categories={categories}
          selected={selectedCategories}
          isLoading={isLoadingCategories}
          onSelectionChange={(categories) => {
            setSelectedCategories(categories);
            setCategoryRates((prev) => {
              const next = { ...prev };
              const ids = new Set(categories.map((c) => c.id));
              for (const id of Object.keys(next)) {
                if (!ids.has(id)) delete next[id];
              }
              return next;
            });
            if (errors.categories) {
              setErrors({ ...errors, categories: "" });
            }
          }}
        />
        {errors.categories && (
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={14}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {errors.categories}
            </Text>
          </View>
        )}

        <CategoryRatesEditor
          selectedCategories={selectedCategories}
          rates={categoryRates}
          onRatesChange={(categoryId, value) => {
            setCategoryRates((prev) => ({ ...prev, [categoryId]: value }));
            if (errors[categoryId]) {
              setErrors((e) => ({ ...e, [categoryId]: "" }));
            }
          }}
          errors={errors}
        />

        <Text variant="small" style={styles.radiusLabel}>
          Radio de servicio (km)
        </Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS_KM.map((km) => {
            const isSelected = serviceRadiusKm === km;
            return (
              <TouchableOpacity
                key={km}
                onPress={() => setServiceRadiusKm(km)}
                style={[
                  styles.radiusChip,
                  isSelected && styles.radiusChipSelected,
                ]}
              >
                <Text
                  variant="small"
                  style={[
                    styles.radiusChipText,
                    isSelected && styles.radiusChipTextSelected,
                  ]}
                >
                  {km} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Dirección base (opcional)"
          icon="map-pin"
          value={baseAddress}
          onChangeText={(text) => {
            setBaseAddress(text);
            setShowAddressSuggestions(true);
          }}
          onBlur={() => setShowAddressSuggestions(false)}
          placeholder="Ej: Bvar. España 1234, Montevideo"
          autoCapitalize="words"
          style={styles.input}
        />
        {showAddressSuggestions &&
          addressSuggestions.suggestions.length > 0 &&
          baseAddress.trim().length >= 2 && (
            <View style={styles.suggestionsList}>
              {addressSuggestions.suggestions.slice(0, 5).map((s) => (
                <TouchableOpacity
                  key={s.id ?? s.label}
                  onPress={() => {
                    setBaseAddress(s.label);
                    setShowAddressSuggestions(false);
                  }}
                  style={styles.suggestionItem}
                >
                  <Feather
                    name="map-pin"
                    size={14}
                    color={theme.colors.muted}
                  />
                  <Text
                    variant="small"
                    style={styles.suggestionText}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        {(error || errors.submit) && (
          <View style={styles.errorContainer}>
            <Feather
              name="alert-circle"
              size={14}
              color={theme.colors.danger}
            />
            <Text variant="small" style={styles.error}>
              {error || errors.submit}
            </Text>
          </View>
        )}

        {isLoading || sessionLoading ? (
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing[2],
  },
  title: {
    marginLeft: theme.spacing[2],
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
    marginTop: -theme.spacing[1],
  },
  error: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[4],
  },
  radiusLabel: {
    marginBottom: theme.spacing[1],
    color: theme.colors.muted,
  },
  radiusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  radiusChip: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  radiusChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "20",
  },
  radiusChipText: {
    color: theme.colors.text,
  },
  radiusChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  suggestionsList: {
    marginTop: -theme.spacing[2],
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    maxHeight: 180,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    marginLeft: theme.spacing[2],
    flex: 1,
    color: theme.colors.text,
  },
});

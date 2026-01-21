import { useState, useEffect } from "react";
import { StyleSheet, ScrollView, Alert, View, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { Input } from "@components/ui/Input";
import { CategorySelector } from "@components/presentational/CategorySelector";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "@hooks/shared";
import { invalidateRelatedQueries } from "@lib/react-query/utils";
import { Category } from "@repo/domain";
import { theme } from "../../theme";

export function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [serviceArea, setServiceArea] = useState("");
  const [bio, setBio] = useState("");

  // Fetch current pro profile
  const { data: pro, isLoading, refetch } = trpc.pro.getMyProfile.useQuery(undefined, {
    retry: false,
  });

  // Initialize form values when profile loads
  useEffect(() => {
    if (pro) {
      setName(pro.name || "");
      setPhone(pro.phone || "");
      setHourlyRate(pro.hourlyRate?.toString() || "");
      setSelectedCategories((pro.categories as Category[]) || []);
      setServiceArea(pro.serviceArea || "");
      setBio(pro.bio || "");
    }
  }, [pro]);

  // Update mutation
  const updateMutation = trpc.pro.updateProfile.useMutation({
    ...invalidateRelatedQueries(queryClient, [
      [["pro", "getMyProfile"]],
      [["pro", "getById"]], // Invalidate public profile queries too
    ]),
    onSuccess: async () => {
      // Refetch to ensure we have the latest data before navigating back
      await refetch();
      Alert.alert("Guardado", "Tu perfil fue actualizado correctamente.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "No se pudo guardar el perfil. Por favor, intentá nuevamente.");
    },
  });

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return false;
    }

    if (!phone.trim()) {
      Alert.alert("Error", "El teléfono es requerido");
      return false;
    }

    const hourlyRateNum = parseFloat(hourlyRate);
    if (!hourlyRate.trim()) {
      Alert.alert("Error", "La tarifa por hora es requerida");
      return false;
    }
    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      Alert.alert("Error", "La tarifa debe ser un número mayor a 0");
      return false;
    }

    if (selectedCategories.length === 0) {
      Alert.alert("Error", "Seleccioná al menos una categoría");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      hourlyRate: parseFloat(hourlyRate),
      categories: selectedCategories,
      serviceArea: serviceArea.trim() || undefined,
      bio: bio.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={theme.colors.muted} />
          <Text variant="body" style={styles.loadingText}>
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.titleRow}>
        <Feather name="edit" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Editar perfil
        </Text>
      </View>

      {/* Personal Information */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Información personal
          </Text>
        </View>

        {/* Email - Read-only display at top */}
        <View style={styles.emailContainer}>
          <View style={styles.labelRow}>
            <Feather name="mail" size={14} color={theme.colors.muted} />
            <Text variant="small" style={styles.label}>
              Email
            </Text>
          </View>
          <Text variant="body" style={styles.emailValue}>
            {pro?.email || ""}
          </Text>
        </View>

        <Input
          label="Nombre completo *"
          icon="user"
          value={name}
          onChangeText={setName}
          placeholder="Ingresá tu nombre completo"
          style={styles.input}
        />

        <Input
          label="Teléfono *"
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="Ingresá tu teléfono"
          keyboardType="phone-pad"
          style={styles.input}
        />
      </Card>

      {/* Professional Information */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="briefcase" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Información profesional
          </Text>
        </View>

        <Input
          label="Tarifa por hora *"
          icon="dollar-sign"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="Ej: 1500"
          keyboardType="numeric"
          style={styles.input}
        />

        <CategorySelector selected={selectedCategories} onSelectionChange={setSelectedCategories} />

        <Input
          label="Área de servicio (opcional)"
          icon="map-pin"
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="Ej: Montevideo Centro"
          style={styles.input}
        />
      </Card>

      {/* Bio */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Biografía
          </Text>
        </View>
        <Text variant="body" style={styles.bioDescription}>
          Contá a tus clientes sobre tu experiencia, especialidades y lo que te hace único.
        </Text>
        <View style={styles.bioInputContainer}>
          <TextInput
            style={styles.bioInput}
            placeholder="Escribí tu biografía aquí..."
            placeholderTextColor={theme.colors.muted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <View style={styles.bioFooter}>
            <Text variant="xs" style={styles.bioHint}>
              La biografía es opcional y aparecerá en tu perfil público
            </Text>
            <Text variant="xs" style={styles.bioCounter}>
              {bio.length}/1000
            </Text>
          </View>
        </View>
      </Card>

      {/* Save Button */}
      <Button
        onPress={handleSave}
        disabled={updateMutation.isPending}
        style={styles.saveButton}
      >
        {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
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
    paddingVertical: theme.spacing[8],
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
  bioDescription: {
    marginBottom: theme.spacing[2],
    color: theme.colors.muted,
  },
  bioInputContainer: {
    marginBottom: theme.spacing[3],
  },
  bioInput: {
    minHeight: 120,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  bioFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing[1],
  },
  bioHint: {
    flex: 1,
    color: theme.colors.muted,
  },
  bioCounter: {
    color: theme.colors.muted,
    marginLeft: theme.spacing[2],
  },
  emailContainer: {
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
  emailValue: {
    color: theme.colors.text,
  },
  saveButton: {
    width: "100%",
    marginTop: theme.spacing[2],
  },
});

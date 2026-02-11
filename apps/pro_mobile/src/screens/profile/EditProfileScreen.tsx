import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  Alert,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Feather } from "@expo/vector-icons";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Text } from "@components/ui/Text";
import { Input } from "@components/ui/Input";
import { useMyProProfile, useUpdateProfile } from "@hooks/pro";
import { useUploadProAvatar } from "@hooks/upload";
import { useAddressSuggestions } from "@hooks/location";
import { theme } from "../../theme";

const RADIUS_OPTIONS_KM = [5, 10, 15, 25, 50] as const;
const DEFAULT_RADIUS_KM = 10;

const AVATAR_SIZE = 96;

export function EditProfileScreen() {
  const router = useRouter();
  const { data: pro, isLoading, refetch } = useMyProProfile();
  const updateMutation = useUpdateProfile();
  const {
    uploadAvatar,
    isUploading: isUploadingAvatar,
    error: avatarError,
  } = useUploadProAvatar();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const addressSuggestions = useAddressSuggestions(
    showAddressSuggestions ? baseAddress : ""
  );

  const handleChangePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso necesario",
        "Se necesita acceso a la galería para elegir una foto."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    try {
      const { uri } = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      await uploadAvatar(uri, "image/jpeg");
      await refetch();
      Alert.alert("Listo", "Tu foto de perfil fue actualizada.");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo subir la foto."
      );
    }
  }, [uploadAvatar, refetch]);

  useEffect(() => {
    if (pro) {
      setName(pro.name || "");
      setPhone(pro.phone || "");
      setBio(pro.bio || "");
      setBaseAddress(pro.baseAddressLine ?? "");
      setServiceRadiusKm(pro.serviceRadiusKm ?? DEFAULT_RADIUS_KM);
    }
  }, [pro]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "El teléfono es requerido");
      return false;
    }

    updateMutation.mutate(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        baseAddress: baseAddress.trim() || undefined,
        serviceRadiusKm,
      },
      {
        onSuccess: async () => {
          await refetch();
          Alert.alert("Guardado", "Tu perfil fue actualizado correctamente.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (error: { message?: string }) => {
          Alert.alert(
            "Error",
            error.message ??
              "No se pudo guardar el perfil. Por favor, intentá nuevamente."
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={theme.colors.muted} />
          <Text variant="body" style={styles.loadingText}>
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  const categoryCount = pro?.categoryIds?.length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleRow}>
        <Feather name="edit" size={24} color={theme.colors.primary} />
        <Text variant="h1" style={styles.title}>
          Editar perfil
        </Text>
      </View>

      {/* Avatar */}
      <Card style={styles.card}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarRow}>
            {pro?.avatarUrl ? (
              <Image
                source={{ uri: pro.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Feather
                  name="user"
                  size={AVATAR_SIZE / 2}
                  color={theme.colors.muted}
                />
              </View>
            )}
            <View style={styles.avatarActions}>
              <Button
                onPress={handleChangePhoto}
                disabled={isUploadingAvatar}
                variant="secondary"
                style={styles.changePhotoButton}
              >
                {isUploadingAvatar ? "Subiendo..." : "Cambiar foto"}
              </Button>
              {avatarError && (
                <Text variant="xs" style={styles.avatarError}>
                  {avatarError.message}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Personal Information */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Información personal
          </Text>
        </View>

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

        <TouchableOpacity
          onPress={() => router.push("/profile/categories")}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Feather name="layers" size={20} color={theme.colors.text} />
            <View style={styles.linkTextBlock}>
              <Text variant="body" style={styles.linkText}>
                Categorías de servicio
              </Text>
              {categoryCount > 0 && (
                <Text variant="small" style={styles.linkHint}>
                  {categoryCount}{" "}
                  {categoryCount === 1 ? "categoría" : "categorías"}
                </Text>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.colors.muted} />
        </TouchableOpacity>

        {pro?.serviceArea ? (
          <View style={styles.readOnlyRow}>
            <Feather name="map-pin" size={20} color={theme.colors.muted} />
            <Text variant="small" style={styles.readOnlyLabel}>
              Zona mostrada en resultados: {pro.serviceArea}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Zona de trabajo y ubicación */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Feather name="map-pin" size={20} color={theme.colors.primary} />
          <Text variant="h2" style={styles.sectionTitle}>
            Zona de trabajo y ubicación
          </Text>
        </View>
        <Text variant="small" style={styles.locationHint}>
          Tu dirección base y radio de servicio determinan en qué búsquedas
          aparecés (clientes dentro del radio te verán).
        </Text>

        <Text variant="small" style={[styles.label, styles.labelTop]}>
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

        <Text variant="small" style={[styles.label, styles.labelTop]}>
          Dirección base
        </Text>
        <View style={styles.addressContainer}>
          <Input
            value={baseAddress}
            onChangeText={(text) => {
              setBaseAddress(text);
              setShowAddressSuggestions(true);
            }}
            onBlur={() => setShowAddressSuggestions(false)}
            placeholder="Ej: Bvar. España 1234, Montevideo"
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
        </View>
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
          Contá a tus clientes sobre tu experiencia, especialidades y lo que te
          hace único.
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
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[3],
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkTextBlock: {
    marginLeft: theme.spacing[2],
  },
  linkText: {
    color: theme.colors.text,
  },
  linkHint: {
    color: theme.colors.muted,
    marginTop: theme.spacing[1],
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
  labelTop: {
    marginTop: theme.spacing[2],
  },
  readOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing[2],
  },
  readOnlyLabel: {
    marginLeft: theme.spacing[2],
    color: theme.colors.muted,
  },
  emailValue: {
    color: theme.colors.text,
  },
  saveButton: {
    width: "100%",
    marginTop: theme.spacing[2],
  },
  avatarSection: {
    marginBottom: theme.spacing[2],
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.muted,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: {
    flex: 1,
  },
  changePhotoButton: {
    alignSelf: "flex-start",
  },
  avatarError: {
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  locationHint: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[3],
  },
  radiusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
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
  addressContainer: {
    marginBottom: theme.spacing[2],
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

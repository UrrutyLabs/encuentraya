import { View, StyleSheet, Modal, Image, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { Button } from "@components/ui/Button";
import { MAX_WORK_PROOF_PHOTOS } from "@repo/upload";
import { theme } from "../../../theme";

interface WorkProofAsset {
  uri: string;
  mimeType?: string;
}

interface JobDetailCompleteModalProps {
  visible: boolean;
  onRequestClose: () => void;
  workProofError: string | null;
  workProofAssets: WorkProofAsset[];
  onTakePhoto: () => Promise<void>;
  onPickFromGallery: () => Promise<void>;
  onCompleteWithPhotos: () => Promise<void>;
  onCancel: () => void;
  isUploadingWorkProof: boolean;
  isProcessingWorkProofPhotos: boolean;
  isCompleting: boolean;
  isSubmittingCompletion: boolean;
}

export function JobDetailCompleteModal({
  visible,
  onRequestClose,
  workProofError,
  workProofAssets,
  onTakePhoto,
  onPickFromGallery,
  onCompleteWithPhotos,
  onCancel,
  isUploadingWorkProof,
  isProcessingWorkProofPhotos,
  isCompleting,
  isSubmittingCompletion,
}: JobDetailCompleteModalProps) {
  const handleAddPhotosPress = () => {
    Alert.alert("Agregar fotos", "¿De dónde querés agregar la foto?", [
      { text: "Tomar foto", onPress: () => void onTakePhoto() },
      { text: "Elegir de galería", onPress: () => void onPickFromGallery() },
      { text: "Cancelar", style: "cancel" },
    ]);
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="h2" style={styles.modalTitle}>
            ¿Agregar fotos del trabajo?
          </Text>
          <Text variant="small" style={styles.modalSubtitle}>
            Opcional. Podés subir hasta {MAX_WORK_PROOF_PHOTOS} fotos (5 MB
            c/u).
          </Text>
          {workProofError && (
            <View style={styles.workProofErrorRow}>
              <Feather
                name="alert-circle"
                size={14}
                color={theme.colors.danger}
              />
              <Text variant="small" style={styles.workProofError}>
                {workProofError}
              </Text>
            </View>
          )}
          {workProofAssets.length > 0 && (
            <View style={styles.workProofPreviewGrid}>
              {workProofAssets.map((asset, i) => (
                <Image
                  key={`${asset.uri}-${i}`}
                  source={{ uri: asset.uri }}
                  style={styles.workProofPreviewThumb}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          {workProofAssets.length < MAX_WORK_PROOF_PHOTOS && (
            <Button
              variant="secondary"
              onPress={handleAddPhotosPress}
              disabled={isUploadingWorkProof || isProcessingWorkProofPhotos}
              style={styles.actionButton}
            >
              {isProcessingWorkProofPhotos ? "Procesando..." : "Agregar fotos"}
            </Button>
          )}
          <Button
            variant="primary"
            onPress={onCompleteWithPhotos}
            disabled={
              isCompleting || isSubmittingCompletion || isUploadingWorkProof
            }
            style={styles.actionButton}
          >
            {isUploadingWorkProof
              ? "Subiendo fotos..."
              : isCompleting || isSubmittingCompletion
                ? "Completando..."
                : workProofAssets.length > 0
                  ? "Subir fotos y completar"
                  : "Completar sin fotos"}
          </Button>
          <Button
            variant="ghost"
            onPress={onCancel}
            style={styles.actionButton}
          >
            Cancelar
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  modalTitle: {
    marginBottom: theme.spacing[1],
  },
  modalSubtitle: {
    color: theme.colors.muted,
    marginBottom: theme.spacing[4],
  },
  workProofErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing[2],
  },
  workProofError: {
    marginLeft: theme.spacing[1],
    color: theme.colors.danger,
  },
  workProofPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  workProofPreviewThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
  },
  actionButton: {
    marginBottom: theme.spacing[2],
  },
});

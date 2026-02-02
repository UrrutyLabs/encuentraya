import { View, StyleSheet, ScrollView } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Text } from "@components/ui/Text";
import { JobDetailSkeleton } from "@components/presentational/JobDetailSkeleton";
import { useOrderActions, useOrderDetail } from "@hooks/order";
import { useUploadWorkProof } from "@hooks/upload";
import { OrderStatus, toMinorUnits } from "@repo/domain";
import { MAX_WORK_PROOF_PHOTOS } from "@repo/upload";
import {
  getJobStatusLabel,
  getJobStatusVariant,
} from "../../../utils/jobStatus";
import { theme } from "../../../theme";
import { useCategoryLookup } from "../../../hooks/category/useCategoryLookup";
import { JobDetailHeader } from "./JobDetailHeader";
import { JobDetailSummary, type QuickQuestionAnswer } from "./JobDetailSummary";
import { JobDetailPhotoGrid } from "./JobDetailPhotoGrid";
import { JobDetailChatCta } from "./JobDetailChatCta";
import { JobDetailActionError } from "./JobDetailActionError";
import { JobDetailActions } from "./JobDetailActions";
import { JobDetailCompleteModal } from "./JobDetailCompleteModal";

const QUOTE_AMOUNT_MAX_MAJOR = 999999;

export function JobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  const orderId = jobId;
  const { order, isLoading, error, refetch } = useOrderDetail(orderId);

  const {
    acceptOrder,
    rejectOrder,
    markOnMyWay,
    arriveOrder,
    completeOrder,
    submitQuote,
    submitCompletion,
    isAccepting,
    isRejecting,
    isMarkingOnMyWay,
    isArriving,
    isCompleting,
    isSubmittingQuote,
    isSubmittingCompletion,
    error: actionError,
  } = useOrderActions(() => {
    refetch();
  });

  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [workProofAssets, setWorkProofAssets] = useState<
    { uri: string; mimeType?: string }[]
  >([]);
  const [workProofError, setWorkProofError] = useState<string | null>(null);
  const [isProcessingWorkProofPhotos, setIsProcessingWorkProofPhotos] =
    useState(false);

  const { uploadWorkProofPhotos, isUploading: isUploadingWorkProof } =
    useUploadWorkProof(orderId ?? "");

  const displayStatus: OrderStatus | null =
    localStatus || (order?.status as OrderStatus) || null;

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
    } catch {
      // Error handled by hook
    }
  }, [orderId, arriveOrder]);

  const doComplete = useCallback(
    async (photoUrls?: string[]) => {
      if (!orderId || !order) return;
      const isFixed = order.pricingMode === "fixed";
      if (isFixed) {
        await submitCompletion(orderId, { photoUrls });
      } else {
        const finalHours =
          order.finalHoursSubmitted ?? order.estimatedHours ?? 0;
        await completeOrder(orderId, finalHours, { photoUrls });
      }
      setLocalStatus(OrderStatus.AWAITING_CLIENT_APPROVAL);
      setShowCompleteSheet(false);
      setWorkProofAssets([]);
      setWorkProofError(null);
    },
    [orderId, order, completeOrder, submitCompletion]
  );

  const handleComplete = useCallback(() => {
    if (!orderId || !order) return;
    setShowCompleteSheet(true);
  }, [orderId, order]);

  const handleCompleteWithoutPhotos = useCallback(async () => {
    try {
      await doComplete();
    } catch {
      // Error handled by hook
    }
  }, [doComplete]);

  const handlePickWorkProofPhotos = useCallback(async () => {
    setWorkProofError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setWorkProofError("Se necesita permiso para acceder a las fotos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const remaining = MAX_WORK_PROOF_PHOTOS - workProofAssets.length;
    const assetsToProcess = result.assets.slice(0, remaining);
    setIsProcessingWorkProofPhotos(true);
    try {
      const processed = await Promise.all(
        assetsToProcess.map(async (asset) => {
          const { uri } = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1920 } }],
            {
              compress: 0.8,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );
          return { uri, mimeType: "image/jpeg" as const };
        })
      );
      setWorkProofAssets((prev) => [...prev, ...processed]);
    } catch (err) {
      setWorkProofError(
        err instanceof Error ? err.message : "Error al procesar las fotos"
      );
    } finally {
      setIsProcessingWorkProofPhotos(false);
    }
  }, [workProofAssets.length]);

  const handleTakeWorkProofPhoto = useCallback(async () => {
    setWorkProofError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setWorkProofError(
        "Se necesita permiso de cámara para tomar fotos del trabajo"
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const remaining = MAX_WORK_PROOF_PHOTOS - workProofAssets.length;
    if (remaining <= 0) return;
    const asset = result.assets[0];
    setIsProcessingWorkProofPhotos(true);
    try {
      const { uri } = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1920 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      setWorkProofAssets((prev) => [
        ...prev,
        { uri, mimeType: "image/jpeg" as const },
      ]);
    } catch (err) {
      setWorkProofError(
        err instanceof Error ? err.message : "Error al tomar la foto"
      );
    } finally {
      setIsProcessingWorkProofPhotos(false);
    }
  }, [workProofAssets.length]);

  const handleCompleteWithPhotos = useCallback(async () => {
    if (workProofAssets.length === 0) {
      await handleCompleteWithoutPhotos();
      return;
    }
    setWorkProofError(null);
    try {
      const photoUrls = await uploadWorkProofPhotos(workProofAssets);
      await doComplete(photoUrls);
    } catch (err) {
      setWorkProofError(
        err instanceof Error ? err.message : "Error al subir las fotos"
      );
    }
  }, [
    workProofAssets,
    uploadWorkProofPhotos,
    doComplete,
    handleCompleteWithoutPhotos,
  ]);

  const handleSubmitQuote = useCallback(async () => {
    if (!orderId) return;
    setQuoteError("");
    const num = parseFloat(quoteAmount);
    if (!quoteAmount.trim()) {
      setQuoteError("Ingresá el monto del presupuesto");
      return;
    }
    if (isNaN(num) || num <= 0) {
      setQuoteError("El monto debe ser mayor a 0");
      return;
    }
    if (num > QUOTE_AMOUNT_MAX_MAJOR) {
      setQuoteError(`Máximo ${QUOTE_AMOUNT_MAX_MAJOR}`);
      return;
    }
    try {
      const amountCents = toMinorUnits(num);
      await submitQuote(orderId, amountCents, quoteMessage.trim() || undefined);
    } catch {
      // Error handled by hook
    }
  }, [orderId, quoteAmount, quoteMessage, submitQuote]);

  const statusLabel = useMemo(
    () => (displayStatus ? getJobStatusLabel(displayStatus) : ""),
    [displayStatus]
  );

  const statusVariant = useMemo(
    () => (displayStatus ? getJobStatusVariant(displayStatus) : "info"),
    [displayStatus]
  );

  const { getCategoryName, categoryMap } = useCategoryLookup();

  const categoryLabel = useMemo(() => {
    if (!order) return "";
    const categoryNameFromMetadata = order.categoryMetadataJson?.name as
      | string
      | undefined;
    if (categoryNameFromMetadata) return categoryNameFromMetadata;
    return getCategoryName(order.categoryId);
  }, [order, getCategoryName]);

  const quickQuestionAnswers = useMemo((): QuickQuestionAnswer[] => {
    if (!order?.categoryMetadataJson) return [];
    const metadata = order.categoryMetadataJson as Record<string, unknown>;
    const answers = metadata.quickQuestionAnswers as
      | Record<string, unknown>
      | undefined;
    if (!answers || Object.keys(answers).length === 0) return [];
    const category = categoryMap.get(order.categoryId);
    const configJson = category?.configJson as
      | { quick_questions?: { key: string; label: string; type: string }[] }
      | undefined;
    const questions = configJson?.quick_questions || [];
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
        return { label: q.label, value: formattedValue };
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

  const isPendingProConfirmation = useMemo(
    () => displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION,
    [displayStatus]
  );

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

  const isFixedOrder = order.pricingMode === "fixed";
  const canAccept = displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION;
  const canReject = displayStatus === OrderStatus.PENDING_PRO_CONFIRMATION;
  const canMarkOnMyWay = displayStatus === OrderStatus.CONFIRMED;
  const canArrive =
    displayStatus === OrderStatus.IN_PROGRESS && !order.arrivedAt;
  const canComplete =
    displayStatus === OrderStatus.IN_PROGRESS && !!order.arrivedAt;
  const showSendQuoteForm =
    displayStatus === OrderStatus.ACCEPTED &&
    isFixedOrder &&
    !(order.quotedAmountCents ?? 0);
  const showQuoteSent =
    displayStatus === OrderStatus.ACCEPTED &&
    isFixedOrder &&
    (order.quotedAmountCents ?? 0) > 0;
  const isReadOnly =
    displayStatus === OrderStatus.COMPLETED ||
    displayStatus === OrderStatus.CANCELED ||
    displayStatus === OrderStatus.PAID ||
    displayStatus === OrderStatus.AWAITING_CLIENT_APPROVAL ||
    displayStatus === OrderStatus.DISPUTED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <JobDetailHeader
        statusLabel={statusLabel}
        statusVariant={statusVariant}
      />

      <JobDetailSummary
        order={order}
        categoryLabel={categoryLabel}
        formattedDate={formattedDate}
        quickQuestionAnswers={quickQuestionAnswers}
        isPendingProConfirmation={isPendingProConfirmation}
        isAcceptedButNotPaid={isAcceptedButNotPaid}
      />

      <JobDetailPhotoGrid
        title="Fotos del pedido"
        photoUrls={order.photoUrls ?? []}
      />

      <JobDetailChatCta
        orderId={orderId ?? ""}
        onPress={() => router.push(`/job/${orderId}/chat` as any)}
      />

      {actionError && <JobDetailActionError message={actionError} />}

      {!isReadOnly && (
        <JobDetailActions
          order={order}
          quoteAmount={quoteAmount}
          quoteMessage={quoteMessage}
          quoteError={quoteError}
          onQuoteAmountChange={(text) => {
            setQuoteAmount(text.replace(/[^0-9.]/g, ""));
            if (quoteError) setQuoteError("");
          }}
          onQuoteMessageChange={setQuoteMessage}
          onSubmitQuote={handleSubmitQuote}
          isSubmittingQuote={isSubmittingQuote}
          showSendQuoteForm={showSendQuoteForm}
          showQuoteSent={showQuoteSent}
          canAccept={canAccept}
          canReject={canReject}
          canMarkOnMyWay={canMarkOnMyWay}
          canArrive={canArrive}
          canComplete={canComplete}
          onAccept={handleAccept}
          onReject={handleReject}
          onMarkOnMyWay={handleMarkOnMyWay}
          onArrive={handleArrive}
          onComplete={handleComplete}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
          isMarkingOnMyWay={isMarkingOnMyWay}
          isArriving={isArriving}
          isCompleting={isCompleting}
          isSubmittingCompletion={isSubmittingCompletion}
        />
      )}

      <JobDetailPhotoGrid
        title="Fotos del trabajo completado"
        photoUrls={order.workProofPhotoUrls ?? []}
      />

      <JobDetailCompleteModal
        visible={showCompleteSheet}
        onRequestClose={() => setShowCompleteSheet(false)}
        workProofError={workProofError}
        workProofAssets={workProofAssets}
        onTakePhoto={handleTakeWorkProofPhoto}
        onPickFromGallery={handlePickWorkProofPhotos}
        onCompleteWithPhotos={handleCompleteWithPhotos}
        onCancel={() => {
          setShowCompleteSheet(false);
          setWorkProofAssets([]);
          setWorkProofError(null);
        }}
        isUploadingWorkProof={isUploadingWorkProof}
        isProcessingWorkProofPhotos={isProcessingWorkProofPhotos}
        isCompleting={isCompleting}
        isSubmittingCompletion={isSubmittingCompletion}
      />
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
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing[2],
  },
});

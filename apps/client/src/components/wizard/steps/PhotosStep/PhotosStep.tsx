"use client";

import { useCallback, useState, useRef, useMemo } from "react";
import { useWizardState } from "@/lib/wizard/useWizardState";
import { usePhotoUrls } from "@/contexts/PhotoUrlsContext";
import { useUploadOrderPhoto } from "@/hooks/upload/useUploadOrderPhoto";
import { MAX_ORDER_PHOTOS } from "@repo/upload";
import { PhotosStepHeader } from "./PhotosStepHeader";
import { PhotosStepContent, type PhotoItem } from "./PhotosStepContent";
import { PhotosStepNavigation } from "./PhotosStepNavigation";

interface PhotosStepProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function PhotosStep({}: PhotosStepProps) {
  const { photoUrls, setPhotoUrls } = usePhotoUrls();
  const { navigateToStep } = useWizardState();
  const { uploadOrderPhotos, isUploading } = useUploadOrderPhoto();

  const [pendingFiles, setPendingFiles] = useState<
    { file: File; id: string }[]
  >([]);
  const [addError, setAddError] = useState<string | null>(null);
  const fileIdRef = useRef(0);

  const handleAddFiles = useCallback(
    (files: File[]) => {
      setAddError(null);
      const currentTotal = photoUrls.length + pendingFiles.length;
      const remaining = MAX_ORDER_PHOTOS - currentTotal;
      const toAdd = files.slice(0, remaining).map((file) => {
        fileIdRef.current += 1;
        return { file, id: `file-${fileIdRef.current}` };
      });
      setPendingFiles((prev) => [...prev, ...toAdd]);
    },
    [photoUrls.length, pendingFiles.length]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const urlMatch = photoUrls.find((u) => u === id);
      if (urlMatch) {
        setPhotoUrls(photoUrls.filter((u) => u !== id));
        return;
      }
      setPendingFiles((prev) => prev.filter((p) => p.id !== id));
    },
    [photoUrls, setPhotoUrls]
  );

  const items: PhotoItem[] = useMemo(() => {
    const urlItems: PhotoItem[] = photoUrls.map((url) => ({
      type: "url" as const,
      url,
      id: url,
    }));
    const fileItems: PhotoItem[] = pendingFiles.map(({ file, id }) => ({
      type: "file" as const,
      file,
      id,
    }));
    return [...urlItems, ...fileItems];
  }, [photoUrls, pendingFiles]);

  const handleBack = useCallback(() => {
    navigateToStep("location");
  }, [navigateToStep]);

  const handleNext = useCallback(async () => {
    setAddError(null);
    const files = pendingFiles.map((p) => p.file);
    if (files.length > 0) {
      try {
        const urls = await uploadOrderPhotos(files);
        setPhotoUrls([...photoUrls, ...urls]);
        setPendingFiles([]);
      } catch (err) {
        setAddError(
          err instanceof Error ? err.message : "Error al subir las fotos"
        );
        return;
      }
    }
    navigateToStep("review");
  }, [
    pendingFiles,
    photoUrls,
    setPhotoUrls,
    uploadOrderPhotos,
    navigateToStep,
  ]);

  return (
    <div className="min-w-0">
      <PhotosStepHeader />
      <PhotosStepContent
        items={items}
        onAddFiles={handleAddFiles}
        onRemove={handleRemove}
        addError={addError}
        clearAddError={() => setAddError(null)}
      />
      <PhotosStepNavigation
        onBack={handleBack}
        onNext={handleNext}
        isUploading={isUploading}
      />
    </div>
  );
}

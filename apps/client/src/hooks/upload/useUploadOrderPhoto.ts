"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { trpc } from "@/lib/trpc/client";
import { uploadFileToPresignedUrl } from "@/lib/upload";
import { isAllowedImageType, MAX_FILE_SIZE_BYTES } from "@repo/upload";

const TEMP_ORDER_ID = "pending";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
} as const;

/**
 * Compress image in the browser before upload; returns a File for the upload pipeline.
 */
async function compressImageFile(file: File): Promise<File> {
  const result = await imageCompression(file, COMPRESSION_OPTIONS);
  if (result instanceof File) return result;
  const blob = result as Blob;
  return new File([blob], file.name, { type: blob.type || "image/jpeg" });
}

/**
 * Hook to upload a single file for order photos (wizard).
 * Compresses image in-browser (resize + quality), then gets presigned URL and PUTs to storage.
 * Returns the storageUrl to store in state / send with createOrder.
 */
export function useUploadOrderPhoto() {
  const [isUploading, setIsUploading] = useState(false);
  const getPresignedUrl = trpc.upload.getPresignedUploadUrl.useMutation();

  const uploadOrderPhoto = useCallback(
    async (file: File): Promise<string> => {
      if (!isAllowedImageType(file.type)) {
        throw new Error("Tipo de archivo no permitido. Usá JPEG, PNG o WebP.");
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `El archivo es muy grande. Máximo ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
        );
      }

      const toUpload = await compressImageFile(file);
      if (toUpload.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `El archivo sigue siendo muy grande después de comprimir. Máximo ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
        );
      }

      const extension = toUpload.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const contentType = toUpload.type || "image/jpeg";

      const { uploadUrl, storageUrl } = await getPresignedUrl.mutateAsync({
        purpose: "order_photo",
        orderId: TEMP_ORDER_ID,
        contentType,
        extension,
      });

      await uploadFileToPresignedUrl(toUpload, uploadUrl);
      return storageUrl;
    },
    [getPresignedUrl]
  );

  const uploadOrderPhotos = useCallback(
    async (files: File[]): Promise<string[]> => {
      setIsUploading(true);
      try {
        const urls = await Promise.all(
          files.map((file) => uploadOrderPhoto(file))
        );
        return urls;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadOrderPhoto]
  );

  return {
    uploadOrderPhoto,
    uploadOrderPhotos,
    isUploading,
    error: getPresignedUrl.error,
  };
}

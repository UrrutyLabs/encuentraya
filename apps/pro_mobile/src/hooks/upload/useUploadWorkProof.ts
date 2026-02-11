"use client";

import { useCallback, useState } from "react";
import { trpc } from "@lib/trpc/client";
import { uploadFileToPresignedUrl } from "@lib/upload";
import { isAllowedImageType } from "@repo/upload";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Hook to upload work proof photos (pro completion).
 * Gets presigned URL with purpose work_proof, then PUTs file from URI to storage.
 * Returns storageUrl to pass to submitCompletion/submitHours.
 */
export function useUploadWorkProof(orderId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const getPresignedUrl = trpc.upload.getPresignedUploadUrl.useMutation();

  const uploadWorkProofPhoto = useCallback(
    async (fileUri: string, contentType: string): Promise<string> => {
      if (!isAllowedImageType(contentType)) {
        throw new Error("Tipo de archivo no permitido. Usá JPEG, PNG o WebP.");
      }

      const extension =
        EXT_BY_MIME[contentType] ??
        (contentType.replace("image/", "") || "jpg");

      const { uploadUrl, storageUrl } = await getPresignedUrl.mutateAsync({
        purpose: "work_proof",
        orderId,
        contentType,
        extension,
      });

      await uploadFileToPresignedUrl(fileUri, uploadUrl, contentType);
      if (!storageUrl) {
        throw new Error("Upload failed: no storage URL returned");
      }
      return storageUrl;
    },
    [orderId, getPresignedUrl]
  );

  const uploadWorkProofPhotos = useCallback(
    async (assets: { uri: string; mimeType?: string }[]): Promise<string[]> => {
      setIsUploading(true);
      try {
        const urls: string[] = [];
        for (const asset of assets) {
          const contentType = asset.mimeType ?? "image/jpeg";
          const url = await uploadWorkProofPhoto(asset.uri, contentType);
          urls.push(url);
        }
        return urls;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadWorkProofPhoto]
  );

  return {
    uploadWorkProofPhoto,
    uploadWorkProofPhotos,
    isUploading,
    error: getPresignedUrl.error,
  };
}

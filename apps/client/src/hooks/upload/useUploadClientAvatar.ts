"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { trpc } from "@/lib/trpc/client";
import { uploadFileToPresignedUrl } from "@/lib/upload";
import { isAllowedImageType, MAX_FILE_SIZE_BYTES } from "@repo/upload";
import { useQueryClient } from "@/hooks/shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 512,
  useWebWorker: true,
} as const;

async function compressImageFile(file: File): Promise<File> {
  const result = await imageCompression(file, COMPRESSION_OPTIONS);
  if (result instanceof File) return result;
  const blob = result as Blob;
  return new File([blob], file.name, { type: blob.type || "image/jpeg" });
}

/**
 * Upload a client profile avatar: get presigned URL (client_avatar), PUT file, then call clientProfile.update with storagePath.
 * Invalidates clientProfile.get on success.
 */
export function useUploadClientAvatar() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const getPresignedUrl = trpc.upload.getPresignedUploadUrl.useMutation();
  const updateProfile = trpc.clientProfile.update.useMutation({
    ...invalidateRelatedQueries(queryClient, [[["clientProfile", "get"]]]),
  });

  const uploadAndSetAvatar = useCallback(
    async (file: File): Promise<void> => {
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

      const { uploadUrl, storagePath } = await getPresignedUrl.mutateAsync({
        purpose: "client_avatar",
        contentType,
        extension,
      });

      if (!storagePath) {
        throw new Error("El servidor no devolvió la ruta del avatar.");
      }

      await uploadFileToPresignedUrl(toUpload, uploadUrl);
      await updateProfile.mutateAsync({ avatarUrl: storagePath });
    },
    [getPresignedUrl, updateProfile]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<void> => {
      setIsUploading(true);
      try {
        await uploadAndSetAvatar(file);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadAndSetAvatar]
  );

  return {
    uploadAvatar,
    isUploading,
    error: getPresignedUrl.error ?? updateProfile.error,
  };
}

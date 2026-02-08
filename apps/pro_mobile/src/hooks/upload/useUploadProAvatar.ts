"use client";

import { useCallback, useState } from "react";
import { trpc } from "@lib/trpc/client";
import { uploadFileToPresignedUrl } from "@lib/upload";
import { isAllowedImageType } from "@repo/upload";
import { useUpdateProfile } from "@hooks/pro";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Upload pro profile avatar: get presigned URL (pro_avatar), PUT file, then call pro.updateProfile with storagePath.
 * Invalidates pro profile queries on success.
 */
export function useUploadProAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const getPresignedUrl = trpc.upload.getPresignedUploadUrl.useMutation();
  const updateProfile = useUpdateProfile();

  const uploadAndSetAvatar = useCallback(
    async (fileUri: string, contentType: string): Promise<void> => {
      if (!isAllowedImageType(contentType)) {
        throw new Error("Tipo de archivo no permitido. Usá JPEG, PNG o WebP.");
      }

      const extension =
        EXT_BY_MIME[contentType] ??
        (contentType.replace("image/", "") || "jpg");

      const { uploadUrl, storagePath } = await getPresignedUrl.mutateAsync({
        purpose: "pro_avatar",
        contentType,
        extension,
      });

      if (!storagePath) {
        throw new Error("El servidor no devolvió la ruta del avatar.");
      }

      await uploadFileToPresignedUrl(fileUri, uploadUrl, contentType);
      await updateProfile.mutateAsync({
        avatarUrl: storagePath,
      });
    },
    [getPresignedUrl, updateProfile]
  );

  const uploadAvatar = useCallback(
    async (fileUri: string, contentType: string): Promise<void> => {
      setIsUploading(true);
      try {
        await uploadAndSetAvatar(fileUri, contentType);
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

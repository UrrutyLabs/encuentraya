/**
 * Upload a file to a presigned URL via PUT.
 * Used after getting uploadUrl from upload.getPresignedUploadUrl.
 */
export async function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

import * as FileSystem from "expo-file-system/legacy";

/**
 * Upload a file (from image picker URI) to a presigned URL via PUT.
 * Reads the file as base64, decodes to binary, then PUTs to uploadUrl.
 */
export async function uploadFileToPresignedUrl(
  fileUri: string,
  uploadUrl: string,
  contentType: string
): Promise<void> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: bytes.buffer,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

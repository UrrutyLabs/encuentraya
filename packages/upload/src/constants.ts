/**
 * Maximum number of photos the client can attach when creating an order (wizard).
 */
export const MAX_ORDER_PHOTOS = 10;

/**
 * Maximum number of work proof photos the pro can attach when marking a job complete.
 */
export const MAX_WORK_PROOF_PHOTOS = 10;

/**
 * Maximum file size per upload (5MB).
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Allowed MIME types for image uploads (order photos and work proof).
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Check if a contentType is an allowed image type.
 */
export function isAllowedImageType(contentType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

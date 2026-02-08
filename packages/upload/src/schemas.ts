import { z } from "zod";

/**
 * Array of photo URLs (order photos or work proof).
 * Used when creating an order (wizard) or when submitting completion (pro).
 */
export const photoUrlsSchema = z.array(z.string().url());

export type PhotoUrls = z.infer<typeof photoUrlsSchema>;

/** Purpose for requesting a presigned upload URL */
export const presignedUploadPurposeSchema = z.enum([
  "order_photo", // Client wizard: order may not exist yet
  "work_proof", // Pro completion: order exists, pro is assigned
  "pro_avatar", // Pro profile picture (no orderId)
  "client_avatar", // Client profile picture (no orderId)
]);

export type PresignedUploadPurpose = z.infer<
  typeof presignedUploadPurposeSchema
>;

/**
 * Input for "get presigned upload URL" API.
 * For order_photo, orderId can be a client-generated temp id (order not created yet).
 * For work_proof, orderId must be an existing order the pro is assigned to.
 * For pro_avatar and client_avatar, orderId is not required.
 */
export const presignedUploadRequestSchema = z.object({
  purpose: presignedUploadPurposeSchema,
  orderId: z.string().min(1).optional(),
  contentType: z.string().min(1),
  extension: z.string().max(10).optional(),
});

export type PresignedUploadRequest = z.infer<
  typeof presignedUploadRequestSchema
>;

/**
 * Response from "get presigned upload URL" API.
 * Client PUTs the file to uploadUrl.
 * For order_photo/work_proof: store storageUrl in state / send to createOrder or submitCompletion.
 * For pro_avatar/client_avatar: send storagePath to "set avatar" API (private bucket, no public storageUrl).
 */
export const presignedUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storageUrl: z.string().url().optional(),
  storagePath: z.string().min(1).optional(),
});

export type PresignedUploadResponse = z.infer<
  typeof presignedUploadResponseSchema
>;

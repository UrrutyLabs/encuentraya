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
]);

export type PresignedUploadPurpose = z.infer<
  typeof presignedUploadPurposeSchema
>;

/**
 * Input for "get presigned upload URL" API.
 * For order_photo, orderId can be a client-generated temp id (order not created yet).
 * For work_proof, orderId must be an existing order the pro is assigned to.
 */
export const presignedUploadRequestSchema = z.object({
  purpose: presignedUploadPurposeSchema,
  orderId: z.string().min(1),
  contentType: z.string().min(1),
  extension: z.string().max(10).optional(),
});

export type PresignedUploadRequest = z.infer<
  typeof presignedUploadRequestSchema
>;

/**
 * Response from "get presigned upload URL" API.
 * Client PUTs the file to uploadUrl, then stores storageUrl in state / sends to createOrder or submitCompletion.
 */
export const presignedUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  storageUrl: z.string().url(),
});

export type PresignedUploadResponse = z.infer<
  typeof presignedUploadResponseSchema
>;

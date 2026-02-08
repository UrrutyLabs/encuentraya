/**
 * Storage abstraction – provider-agnostic interface.
 * No Supabase, S3, or other provider types in this file.
 * Implementations (e.g. SupabaseStorageService) live in separate files.
 */

export interface PresignedUploadResult {
  /** URL the client PUTs to (temporary, signed) */
  uploadUrl: string;
  /** Public URL for display (optional for private buckets e.g. avatars) */
  storageUrl?: string;
  /** Object key within bucket (for private avatars; client sends to "set avatar" API) */
  storagePath?: string;
}

export interface SignedDownloadResult {
  /** Time-limited URL for GET (e.g. for private avatars bucket) */
  url: string;
}

export interface IStorageService {
  createPresignedUploadUrl(params: {
    path: string;
    contentType: string;
    expiresInSeconds?: number;
    /** Bucket name (e.g. "avatars"); when omitted uses default bucket */
    bucket?: string;
  }): Promise<PresignedUploadResult>;

  /**
   * Create a signed download URL for a private object (e.g. avatars bucket).
   * Path is the object key within the bucket (e.g. "pro/userId/file.jpg").
   */
  createSignedDownloadUrl(params: {
    path: string;
    expiresInSeconds?: number;
  }): Promise<SignedDownloadResult>;
}

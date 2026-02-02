/**
 * Storage abstraction – provider-agnostic interface.
 * No Supabase, S3, or other provider types in this file.
 * Implementations (e.g. SupabaseStorageService) live in separate files.
 */

export interface PresignedUploadResult {
  /** URL the client PUTs to (temporary, signed) */
  uploadUrl: string;
  /** URL to store in DB and use for display (stable) */
  storageUrl: string;
}

export interface IStorageService {
  createPresignedUploadUrl(params: {
    path: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedUploadResult>;
}

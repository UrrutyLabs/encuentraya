import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  IStorageService,
  PresignedUploadResult,
  SignedDownloadResult,
} from "./storage.types";

const DEFAULT_BUCKET = "uploads";
const AVATARS_BUCKET = "avatars";

/**
 * Supabase implementation of IStorageService.
 * All Supabase-specific storage logic lives here; upload service and router stay provider-agnostic.
 */
export class SupabaseStorageService implements IStorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(config?: {
    supabaseUrl?: string;
    serviceRoleKey?: string;
    bucket?: string;
  }) {
    const supabaseUrl = config?.supabaseUrl ?? process.env.SUPABASE_URL ?? "";
    const serviceRoleKey =
      config?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "SupabaseStorageService requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    // Use explicit fetch so storage APIs (createSignedUrl, createSignedUploadUrl) work in Node.
    // Without this, createSignedUrl can throw "fetch failed" on the server.
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: globalThis.fetch },
    });
    this.bucket =
      config?.bucket ?? process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;
  }

  async createPresignedUploadUrl(params: {
    path: string;
    contentType: string;
    expiresInSeconds?: number;
    bucket?: string;
  }): Promise<PresignedUploadResult> {
    const bucket = params.bucket ?? this.bucket;
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(params.path, { upsert: false });

    if (error) {
      throw new Error(`Supabase storage signed URL failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("Supabase storage did not return a signed URL");
    }

    const result: PresignedUploadResult = {
      uploadUrl: data.signedUrl,
    };

    if (bucket === AVATARS_BUCKET) {
      result.storagePath = params.path;
    } else {
      const supabaseUrl = process.env.SUPABASE_URL ?? "";
      result.storageUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${params.path}`;
    }

    return result;
  }

  async createSignedDownloadUrl(params: {
    path: string;
    expiresInSeconds?: number;
  }): Promise<SignedDownloadResult> {
    const expiresIn = params.expiresInSeconds ?? 3600;
    const { data, error } = await this.supabase.storage
      .from(AVATARS_BUCKET)
      .createSignedUrl(params.path, expiresIn);

    if (error) {
      throw new Error(
        `Supabase storage signed download URL failed: ${error.message}`
      );
    }

    if (!data?.signedUrl) {
      throw new Error("Supabase storage did not return a signed download URL");
    }

    return { url: data.signedUrl };
  }
}

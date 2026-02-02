import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IStorageService, PresignedUploadResult } from "./storage.types";

const DEFAULT_BUCKET = "uploads";

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

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket =
      config?.bucket ?? process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;
  }

  async createPresignedUploadUrl(params: {
    path: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedUploadResult> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(params.path, { upsert: false });

    if (error) {
      throw new Error(`Supabase storage signed URL failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("Supabase storage did not return a signed URL");
    }

    // Build stable storage URL for DB/display (public URL pattern).
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const storageUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${this.bucket}/${params.path}`;

    return {
      uploadUrl: data.signedUrl,
      storageUrl,
    };
  }
}

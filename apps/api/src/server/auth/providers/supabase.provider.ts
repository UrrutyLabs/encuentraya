import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider } from "../provider";

/**
 * Supabase authentication provider implementation
 * Uses secret key (formerly "service role key") to verify access tokens
 * This key bypasses Row Level Security (RLS) policies
 */
export class SupabaseAuthProvider implements AuthProvider {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Get these from Supabase dashboard → Settings → API (Secret key)"
      );
    }

    // Use secret key (service role) to bypass RLS and verify tokens
    // WARNING: This key has admin privileges - never expose to client
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async verifyAccessToken(token: string): Promise<{ userId: string } | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return { userId: user.id };
    } catch (error) {
      console.error("Error verifying Supabase token:", error);
      return null;
    }
  }
}

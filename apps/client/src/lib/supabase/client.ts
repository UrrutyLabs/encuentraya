import { createClient } from "@supabase/supabase-js";

// Publishable key (formerly "anon key") - safe for client-side use
// Respects Row Level Security (RLS) policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. Get these from Supabase dashboard → Settings → API (Publishable key)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

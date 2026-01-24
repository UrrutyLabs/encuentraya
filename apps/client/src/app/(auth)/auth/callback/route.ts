import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Role } from "@repo/domain";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
  );
}

/**
 * Get API base URL (same logic as in trpc/links.ts)
 */
function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:3002"; // API server port
}

/**
 * Get user role from API using access token
 */
async function getUserRole(accessToken: string): Promise<Role | null> {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/trpc/auth.me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // tRPC response format: { result: { data: { id: string, role: Role } } }
    return data?.result?.data?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange code for session
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    // If we have a session, check user role to determine redirect
    if (sessionData?.session?.access_token) {
      const userRole = await getUserRole(sessionData.session.access_token);

      // If user is PRO and no explicit next parameter, redirect to download app
      if (userRole === Role.PRO && !next) {
        return NextResponse.redirect(
          new URL("/pro/download-app", requestUrl.origin)
        );
      }

      // If user is CLIENT and no explicit next parameter, redirect to search
      if (userRole === Role.CLIENT && !next) {
        return NextResponse.redirect(new URL("/search", requestUrl.origin));
      }
    }
  }

  // Use explicit next parameter or default to search
  const redirectTo = next || "/search";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}

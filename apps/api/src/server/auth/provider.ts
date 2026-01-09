/**
 * Provider-neutral authentication interface
 * Allows swapping Supabase for other auth providers in the future
 */
export interface AuthProvider {
  /**
   * Verifies an access token and returns the user ID if valid
   * @param token - The access token to verify
   * @returns User ID if token is valid, null otherwise
   */
  verifyAccessToken(token: string): Promise<{ userId: string } | null>;
}

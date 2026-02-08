/**
 * Avatar URL cache interface.
 * Used to cache signed avatar URLs in Redis (or no-op when Redis is not configured).
 */
export interface IAvatarCache {
  get(key: string): Promise<string | null>;
  set(key: string, url: string, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

/**
 * Avatar cache strategy.
 * When true: signed URLs are cached in Redis (get/set); fewer calls to Supabase.
 * When false: Redis is bypassed; presigned URL is regenerated on every resolve.
 * Can later be driven by env (e.g. AVATAR_USE_REDIS_CACHE).
 */
export const AVATAR_USE_REDIS_CACHE = false;

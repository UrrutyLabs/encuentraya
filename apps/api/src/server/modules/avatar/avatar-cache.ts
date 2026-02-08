/**
 * Avatar URL cache using Upstash Redis.
 * Caches signed download URLs so we don't sign on every request.
 * Uses same Redis as rate-limiter (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN).
 * When Redis is not configured, acts as a no-op cache (always miss).
 */

import { Redis } from "@upstash/redis";
import type { IAvatarCache } from "./avatar-cache.types";

/** TTL slightly below signed URL expiry (e.g. 1h URL → 55 min cache) */
export const AVATAR_CACHE_TTL_SECONDS = 55 * 60;

export function avatarCacheKeyPro(proProfileId: string): string {
  return `avatar:pro:${proProfileId}`;
}

export function avatarCacheKeyClient(userId: string): string {
  return `avatar:client:${userId}`;
}

class UpstashAvatarCache implements IAvatarCache {
  constructor(private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    const value = await this.redis.get<string>(key);
    return value ?? null;
  }

  async set(key: string, url: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, url, { ex: ttlSeconds });
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

class NoOpAvatarCache implements IAvatarCache {
  async get(): Promise<string | null> {
    return null;
  }

  async set(): Promise<void> {
    // no-op
  }

  async invalidate(): Promise<void> {
    // no-op
  }
}

/**
 * Create avatar cache instance.
 * Uses Upstash Redis when credentials are available; otherwise no-op (cache always misses).
 */
export function createAvatarCache(): IAvatarCache {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
    return new UpstashAvatarCache(redis);
  }

  return new NoOpAvatarCache();
}

/** Singleton for use where DI is not available. Prefer injecting IAvatarCache in new code. */
export const avatarCache = createAvatarCache();

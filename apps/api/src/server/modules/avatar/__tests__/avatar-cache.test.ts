import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAvatarCache,
  avatarCacheKeyPro,
  avatarCacheKeyClient,
  AVATAR_CACHE_TTL_SECONDS,
} from "../avatar-cache";

describe("avatar cache key helpers", () => {
  it("builds pro cache key", () => {
    expect(avatarCacheKeyPro("pro-123")).toBe("avatar:pro:pro-123");
  });

  it("builds client cache key", () => {
    expect(avatarCacheKeyClient("user-456")).toBe("avatar:client:user-456");
  });
});

describe("AVATAR_CACHE_TTL_SECONDS", () => {
  it("is 55 minutes", () => {
    expect(AVATAR_CACHE_TTL_SECONDS).toBe(55 * 60);
  });
});

describe("createAvatarCache", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("returns cache that get returns null when no value set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    const cache = createAvatarCache();
    const value = await cache.get("avatar:pro:any");
    expect(value).toBeNull();
  });

  it("set and invalidate are no-op when Redis not configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    const cache = createAvatarCache();
    await expect(
      cache.set("k", "https://example.com", 60)
    ).resolves.toBeUndefined();
    await expect(cache.invalidate("k")).resolves.toBeUndefined();
  });
});

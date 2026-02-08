/**
 * Resolves avatar storage path to a signed download URL.
 * When AVATAR_USE_REDIS_CACHE is true, uses IAvatarCache to avoid signing on every request.
 */

import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/server/container/tokens";
import type { IStorageService } from "@modules/upload/storage.types";
import type { IAvatarCache } from "./avatar-cache.types";
import { AVATAR_USE_REDIS_CACHE } from "./avatar-config";
import {
  avatarCacheKeyPro,
  avatarCacheKeyClient,
  AVATAR_CACHE_TTL_SECONDS,
} from "./avatar-cache";

/** Signed URL expiry (1 hour). Cache TTL is slightly less (55 min). */
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * Returns true if the value looks like a full URL (legacy DB value).
 * When true, we return it as-is instead of calling storage.
 */
function isLikelyFullUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

@injectable()
export class AvatarUrlService {
  constructor(
    @inject(TOKENS.IStorageService)
    private readonly storageService: IStorageService,
    @inject(TOKENS.IAvatarCache)
    private readonly avatarCache: IAvatarCache
  ) {}

  /**
   * Resolve a storage path to a signed download URL (cache-aware).
   * Returns undefined if path is missing or invalid.
   * Legacy: if path looks like a full URL, returns it as-is.
   */
  async resolve(
    cacheKey: string,
    path: string | null | undefined
  ): Promise<string | undefined> {
    if (!path?.trim()) return undefined;
    if (isLikelyFullUrl(path)) return path;

    if (AVATAR_USE_REDIS_CACHE) {
      const cached = await this.avatarCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const { url } = await this.storageService.createSignedDownloadUrl({
        path: path.trim(),
        expiresInSeconds: SIGNED_URL_EXPIRY_SECONDS,
      });
      if (AVATAR_USE_REDIS_CACHE) {
        await this.avatarCache.set(cacheKey, url, AVATAR_CACHE_TTL_SECONDS);
      }
      return url;
    } catch (err) {
      // e.g. bucket missing, Supabase unreachable, or object not found
      console.warn(
        `Avatar signed URL failed for path "${path.trim()}":`,
        err instanceof Error ? err.message : err
      );
      return undefined;
    }
  }

  async resolveProAvatar(
    proProfileId: string,
    path: string | null | undefined
  ): Promise<string | undefined> {
    return this.resolve(avatarCacheKeyPro(proProfileId), path);
  }

  async resolveClientAvatar(
    userId: string,
    path: string | null | undefined
  ): Promise<string | undefined> {
    return this.resolve(avatarCacheKeyClient(userId), path);
  }
}

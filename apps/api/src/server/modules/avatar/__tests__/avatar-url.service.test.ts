import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvatarUrlService } from "../avatar-url.service";
import type { IStorageService } from "@modules/upload/storage.types";
import type { IAvatarCache } from "../avatar-cache.types";

vi.mock("../avatar-config", () => ({
  AVATAR_USE_REDIS_CACHE: true,
}));

function createMockStorage(): IStorageService {
  return {
    createPresignedUploadUrl: vi.fn(),
    createSignedDownloadUrl: vi.fn().mockResolvedValue({
      url: "https://storage.example.com/avatars/signed?token=abc",
    }),
  };
}

function createMockCache(): IAvatarCache {
  return {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  };
}

describe("AvatarUrlService", () => {
  let service: AvatarUrlService;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockCache: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = createMockStorage();
    mockCache = createMockCache();
    service = new AvatarUrlService(mockStorage, mockCache);
  });

  it("returns undefined when path is empty", async () => {
    await expect(service.resolve("key", null)).resolves.toBeUndefined();
    await expect(service.resolve("key", undefined)).resolves.toBeUndefined();
    await expect(service.resolve("key", "")).resolves.toBeUndefined();
    await expect(service.resolve("key", "   ")).resolves.toBeUndefined();
    expect(mockCache.get).not.toHaveBeenCalled();
    expect(mockStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("returns legacy URL as-is when path looks like http(s) URL", async () => {
    const url = "https://example.com/old-avatar.jpg";
    const result = await service.resolve("key", url);
    expect(result).toBe(url);
    expect(mockCache.get).not.toHaveBeenCalled();
    expect(mockStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("returns cached URL on cache hit", async () => {
    const cachedUrl = "https://cached.example.com/signed";
    vi.mocked(mockCache.get).mockResolvedValue(cachedUrl);
    const result = await service.resolve("avatar:pro:123", "pro/123/abc.jpg");
    expect(result).toBe(cachedUrl);
    expect(mockCache.get).toHaveBeenCalledWith("avatar:pro:123");
    expect(mockStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("creates signed URL and caches on cache miss", async () => {
    vi.mocked(mockCache.get).mockResolvedValue(null);
    const result = await service.resolve("avatar:pro:123", "pro/123/abc.jpg");
    expect(result).toBe("https://storage.example.com/avatars/signed?token=abc");
    expect(mockStorage.createSignedDownloadUrl).toHaveBeenCalledWith({
      path: "pro/123/abc.jpg",
      expiresInSeconds: 3600,
    });
    expect(mockCache.set).toHaveBeenCalledWith(
      "avatar:pro:123",
      "https://storage.example.com/avatars/signed?token=abc",
      3300
    );
  });

  it("resolveProAvatar builds pro cache key and delegates", async () => {
    vi.mocked(mockCache.get).mockResolvedValue("https://signed.pro/1");
    const result = await service.resolveProAvatar("pro-1", "pro/user/av.jpg");
    expect(result).toBe("https://signed.pro/1");
    expect(mockCache.get).toHaveBeenCalledWith("avatar:pro:pro-1");
  });

  it("resolveClientAvatar builds client cache key and delegates", async () => {
    vi.mocked(mockCache.get).mockResolvedValue("https://signed.client/1");
    const result = await service.resolveClientAvatar(
      "user-2",
      "client/user/av.jpg"
    );
    expect(result).toBe("https://signed.client/1");
    expect(mockCache.get).toHaveBeenCalledWith("avatar:client:user-2");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PushDeliveryResolver, NoActivePushTokensError } from "../pushResolver";
import type { DevicePushTokenRepository } from "@modules/push/devicePushToken.repo";

describe("PushDeliveryResolver", () => {
  let resolver: PushDeliveryResolver;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    listActiveTokensByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      listActiveTokensByUserId: vi.fn(),
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    resolver = new PushDeliveryResolver(
      mockRepository as unknown as DevicePushTokenRepository
    );
  });

  describe("resolvePushTokens", () => {
    it("should return active push tokens for user", async () => {
      // Arrange
      const userId = "user-1";
      const tokens = [
        "ExponentPushToken[token-1]",
        "ExponentPushToken[token-2]",
      ];
      mockRepository.listActiveTokensByUserId.mockResolvedValue(tokens);

      // Act
      const result = await resolver.resolvePushTokens(userId);

      // Assert
      expect(mockRepository.listActiveTokensByUserId).toHaveBeenCalledWith(
        userId
      );
      expect(result).toEqual(tokens);
    });

    it("should throw NoActivePushTokensError when no tokens found", async () => {
      // Arrange
      const userId = "user-2";
      mockRepository.listActiveTokensByUserId.mockResolvedValue([]);

      // Act & Assert
      await expect(resolver.resolvePushTokens(userId)).rejects.toThrow(
        NoActivePushTokensError
      );
      await expect(resolver.resolvePushTokens(userId)).rejects.toThrow(
        `No active push tokens found for user: ${userId}`
      );
    });

    it("should return single token when user has one device", async () => {
      // Arrange
      const userId = "user-3";
      const tokens = ["ExponentPushToken[single-token]"];
      mockRepository.listActiveTokensByUserId.mockResolvedValue(tokens);

      // Act
      const result = await resolver.resolvePushTokens(userId);

      // Assert
      expect(result).toEqual(tokens);
      expect(result).toHaveLength(1);
    });

    it("should return multiple tokens when user has multiple devices", async () => {
      // Arrange
      const userId = "user-4";
      const tokens = [
        "ExponentPushToken[device-1]",
        "ExponentPushToken[device-2]",
        "ExponentPushToken[device-3]",
      ];
      mockRepository.listActiveTokensByUserId.mockResolvedValue(tokens);

      // Act
      const result = await resolver.resolvePushTokens(userId);

      // Assert
      expect(result).toEqual(tokens);
      expect(result).toHaveLength(3);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PushTokenService } from "../pushToken.service";
import type { DevicePushTokenRepository } from "../devicePushToken.repo";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import { $Enums } from "@infra/db/prisma";

describe("PushTokenService", () => {
  let service: PushTokenService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    upsertToken: ReturnType<typeof vi.fn>;
    deactivateToken: ReturnType<typeof vi.fn>;
    listActiveTokensByUserId: ReturnType<typeof vi.fn>;
  } {
    return {
      upsertToken: vi.fn(),
      deactivateToken: vi.fn(),
      listActiveTokensByUserId: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.CLIENT, id = "user-1"): Actor {
    return { id, role };
  }

  function createMockTokenEntity(
    overrides?: Partial<{
      id: string;
      userId: string;
      provider: $Enums.PushProvider;
      platform: $Enums.DevicePlatform;
      token: string;
      isActive: boolean;
    }>
  ) {
    return {
      id: "token-1",
      userId: "user-1",
      provider: $Enums.PushProvider.EXPO,
      platform: $Enums.DevicePlatform.IOS,
      token: "ExponentPushToken[test-token]",
      isActive: true,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new PushTokenService(
      mockRepository as unknown as DevicePushTokenRepository
    );
  });

  describe("registerToken", () => {
    it("should register iOS push token for authenticated user", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        platform: "IOS" as const,
        token: "ExponentPushToken[ios-token]",
      };
      const mockToken = createMockTokenEntity({
        userId: actor.id,
        platform: $Enums.DevicePlatform.IOS,
        token: input.token,
      });
      mockRepository.upsertToken.mockResolvedValue(mockToken);

      // Act
      await service.registerToken(actor, input);

      // Assert
      expect(mockRepository.upsertToken).toHaveBeenCalledWith({
        userId: actor.id,
        provider: $Enums.PushProvider.EXPO,
        platform: $Enums.DevicePlatform.IOS,
        token: input.token,
      });
    });

    it("should register Android push token for authenticated user", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        platform: "ANDROID" as const,
        token: "ExponentPushToken[android-token]",
      };
      const mockToken = createMockTokenEntity({
        userId: actor.id,
        platform: $Enums.DevicePlatform.ANDROID,
        token: input.token,
      });
      mockRepository.upsertToken.mockResolvedValue(mockToken);

      // Act
      await service.registerToken(actor, input);

      // Assert
      expect(mockRepository.upsertToken).toHaveBeenCalledWith({
        userId: actor.id,
        provider: $Enums.PushProvider.EXPO,
        platform: $Enums.DevicePlatform.ANDROID,
        token: input.token,
      });
    });

    it("should use actor.id as userId", async () => {
      // Arrange
      const actor = createMockActor(Role.PRO, "pro-user-123");
      const input = {
        platform: "IOS" as const,
        token: "ExponentPushToken[test]",
      };
      mockRepository.upsertToken.mockResolvedValue(createMockTokenEntity());

      // Act
      await service.registerToken(actor, input);

      // Assert
      expect(mockRepository.upsertToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "pro-user-123",
        })
      );
    });
  });

  describe("unregisterToken", () => {
    it("should deactivate push token", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        token: "ExponentPushToken[test-token]",
      };
      const mockToken = createMockTokenEntity({
        token: input.token,
        isActive: false,
      });
      mockRepository.deactivateToken.mockResolvedValue(mockToken);

      // Act
      await service.unregisterToken(actor, input);

      // Assert
      expect(mockRepository.deactivateToken).toHaveBeenCalledWith(input.token);
    });

    it("should handle token not found gracefully", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        token: "ExponentPushToken[non-existent]",
      };
      mockRepository.deactivateToken.mockResolvedValue(null);

      // Act & Assert - should not throw
      await expect(
        service.unregisterToken(actor, input)
      ).resolves.not.toThrow();
      expect(mockRepository.deactivateToken).toHaveBeenCalledWith(input.token);
    });
  });
});

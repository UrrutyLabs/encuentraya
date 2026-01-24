import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Prisma, $Enums } from "@infra/db/prisma";

/**
 * Device push token entity (plain object)
 */
export interface DevicePushTokenEntity {
  id: string;
  userId: string;
  provider: $Enums.PushProvider;
  platform: $Enums.DevicePlatform;
  token: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device push token upsert input
 */
export interface DevicePushTokenUpsertInput {
  userId: string;
  provider: $Enums.PushProvider;
  platform: $Enums.DevicePlatform;
  token: string;
}

/**
 * Device push token repository interface
 * Handles all data access for device push tokens
 */
export interface DevicePushTokenRepository {
  upsertToken(
    input: DevicePushTokenUpsertInput
  ): Promise<DevicePushTokenEntity>;
  deactivateToken(token: string): Promise<DevicePushTokenEntity | null>;
  listActiveTokensByUserId(userId: string): Promise<string[]>;
}

/**
 * Device push token repository implementation using Prisma
 */
@injectable()
export class DevicePushTokenRepositoryImpl implements DevicePushTokenRepository {
  async upsertToken(
    input: DevicePushTokenUpsertInput
  ): Promise<DevicePushTokenEntity> {
    const now = new Date();
    const token = await prisma.devicePushToken.upsert({
      where: { token: input.token },
      create: {
        userId: input.userId,
        provider: input.provider,
        platform: input.platform,
        token: input.token,
        isActive: true,
        lastSeenAt: now,
      },
      update: {
        userId: input.userId,
        provider: input.provider,
        platform: input.platform,
        isActive: true,
        lastSeenAt: now,
      },
    });

    return this.mapPrismaToDomain(token);
  }

  async deactivateToken(token: string): Promise<DevicePushTokenEntity | null> {
    const updated = await prisma.devicePushToken.updateMany({
      where: { token, isActive: true },
      data: { isActive: false },
    });

    if (updated.count === 0) {
      return null;
    }

    const deviceToken = await prisma.devicePushToken.findUnique({
      where: { token },
    });

    return deviceToken ? this.mapPrismaToDomain(deviceToken) : null;
  }

  async listActiveTokensByUserId(userId: string): Promise<string[]> {
    const tokens = await prisma.devicePushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    return tokens.map((t) => t.token);
  }

  private mapPrismaToDomain(
    prismaToken: Prisma.DevicePushTokenGetPayload<Record<string, never>>
  ): DevicePushTokenEntity {
    return {
      id: prismaToken.id,
      userId: prismaToken.userId,
      provider: prismaToken.provider,
      platform: prismaToken.platform,
      token: prismaToken.token,
      isActive: prismaToken.isActive,
      lastSeenAt: prismaToken.lastSeenAt,
      createdAt: prismaToken.createdAt,
      updatedAt: prismaToken.updatedAt,
    };
  }
}

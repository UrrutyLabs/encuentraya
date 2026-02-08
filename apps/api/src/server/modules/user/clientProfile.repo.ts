import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * ClientProfile entity (plain object)
 */
export interface ClientProfileEntity {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  preferredContactMethod: "EMAIL" | "WHATSAPP" | "PHONE" | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ClientProfile repository interface
 * Handles all data access for client profiles
 */
export interface ClientProfileRepository {
  findByUserId(userId: string): Promise<ClientProfileEntity | null>;
  createForUser(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<ClientProfileEntity>;
  upsertForUser(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<ClientProfileEntity>;
}

/**
 * ClientProfile repository implementation using Prisma
 */
@injectable()
export class ClientProfileRepositoryImpl implements ClientProfileRepository {
  async findByUserId(userId: string): Promise<ClientProfileEntity | null> {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    return profile ? this.mapPrismaToDomain(profile) : null;
  }

  async createForUser(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<ClientProfileEntity> {
    const profile = await prisma.clientProfile.create({
      data: {
        userId,
        firstName: data?.firstName ?? null,
        lastName: data?.lastName ?? null,
        email: data?.email ?? null,
        phone: data?.phone ?? null,
        avatarUrl: data?.avatarUrl ?? null,
        preferredContactMethod: data?.preferredContactMethod ?? null,
      },
    });

    return this.mapPrismaToDomain(profile);
  }

  async upsertForUser(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      preferredContactMethod?: "EMAIL" | "WHATSAPP" | "PHONE" | null;
    }
  ): Promise<ClientProfileEntity> {
    const profile = await prisma.clientProfile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: data?.firstName ?? null,
        lastName: data?.lastName ?? null,
        email: data?.email ?? null,
        phone: data?.phone ?? null,
        avatarUrl: data?.avatarUrl ?? null,
        preferredContactMethod: data?.preferredContactMethod ?? null,
      },
      update: {
        firstName: data?.firstName ?? undefined,
        lastName: data?.lastName ?? undefined,
        email: data?.email ?? undefined,
        phone: data?.phone ?? undefined,
        avatarUrl: data?.avatarUrl ?? undefined,
        preferredContactMethod: data?.preferredContactMethod ?? undefined,
      },
    });

    return this.mapPrismaToDomain(profile);
  }

  private mapPrismaToDomain(prismaProfile: {
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    preferredContactMethod: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClientProfileEntity {
    return {
      id: prismaProfile.id,
      userId: prismaProfile.userId,
      firstName: prismaProfile.firstName,
      lastName: prismaProfile.lastName,
      email: prismaProfile.email,
      phone: prismaProfile.phone,
      avatarUrl: prismaProfile.avatarUrl,
      preferredContactMethod: prismaProfile.preferredContactMethod as
        | "EMAIL"
        | "WHATSAPP"
        | "PHONE"
        | null,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
    };
  }
}

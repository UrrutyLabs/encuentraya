import { prisma } from "../db/prisma";

/**
 * ProProfile entity (plain object)
 */
export interface ProProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  hourlyRate: number;
  status: "pending" | "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProProfile create input
 */
export interface ProProfileCreateInput {
  userId: string;
  displayName: string;
  bio?: string;
  hourlyRate: number;
}

/**
 * ProProfile repository interface
 * Handles all data access for service providers
 */
export interface ProRepository {
  create(input: ProProfileCreateInput): Promise<ProProfileEntity>;
  findById(id: string): Promise<ProProfileEntity | null>;
  findByUserId(userId: string): Promise<ProProfileEntity | null>;
  findAll(): Promise<ProProfileEntity[]>;
  updateStatus(
    id: string,
    status: "pending" | "active" | "suspended"
  ): Promise<ProProfileEntity | null>;
  update(
    id: string,
    data: Partial<ProProfileCreateInput>
  ): Promise<ProProfileEntity | null>;
}

/**
 * ProProfile repository implementation using Prisma
 */
class ProRepositoryImpl implements ProRepository {
  async create(input: ProProfileCreateInput): Promise<ProProfileEntity> {
    const proProfile = await prisma.proProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        bio: input.bio,
        hourlyRate: input.hourlyRate,
        status: "pending",
      },
    });

    return this.mapPrismaToDomain(proProfile);
  }

  async findById(id: string): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.findUnique({
      where: { id },
    });

    return proProfile ? this.mapPrismaToDomain(proProfile) : null;
  }

  async findByUserId(userId: string): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.findUnique({
      where: { userId },
    });

    return proProfile ? this.mapPrismaToDomain(proProfile) : null;
  }

  async findAll(): Promise<ProProfileEntity[]> {
    const proProfiles = await prisma.proProfile.findMany({
      orderBy: { createdAt: "desc" },
    });

    return proProfiles.map(this.mapPrismaToDomain);
  }

  async updateStatus(
    id: string,
    status: "pending" | "active" | "suspended"
  ): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.update({
      where: { id },
      data: { status },
    });

    return this.mapPrismaToDomain(proProfile);
  }

  async update(
    id: string,
    data: Partial<ProProfileCreateInput>
  ): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.update({
      where: { id },
      data,
    });

    return this.mapPrismaToDomain(proProfile);
  }

  private mapPrismaToDomain(prismaProProfile: {
    id: string;
    userId: string;
    displayName: string;
    bio: string | null;
    hourlyRate: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProProfileEntity {
    return {
      id: prismaProProfile.id,
      userId: prismaProProfile.userId,
      displayName: prismaProProfile.displayName,
      bio: prismaProProfile.bio,
      hourlyRate: prismaProProfile.hourlyRate,
      status: prismaProProfile.status as "pending" | "active" | "suspended",
      createdAt: prismaProProfile.createdAt,
      updatedAt: prismaProProfile.updatedAt,
    };
  }
}

export const proRepository: ProRepository = new ProRepositoryImpl();

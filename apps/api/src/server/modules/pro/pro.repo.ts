import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Category } from "@repo/domain";

/**
 * ProProfile entity (plain object)
 */
export interface ProProfileEntity {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  hourlyRate: number;
  categories: string[]; // Category enum values
  serviceArea: string | null;
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
  email: string;
  phone?: string | null;
  bio?: string | null;
  hourlyRate: number;
  categories: string[]; // Category enum values
  serviceArea?: string;
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
  findAllWithFilters(filters?: {
    query?: string;
    status?: "pending" | "active" | "suspended";
    limit?: number;
    cursor?: string;
  }): Promise<ProProfileEntity[]>;
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
@injectable()
export class ProRepositoryImpl implements ProRepository {
  async create(input: ProProfileCreateInput): Promise<ProProfileEntity> {
    const proProfile = await prisma.proProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone ?? null,
        bio: input.bio,
        hourlyRate: input.hourlyRate,
        categories: input.categories as Category[], // Prisma expects Category[] enum, but we pass string[]
        serviceArea: input.serviceArea ?? null,
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

  async findAllWithFilters(filters?: {
    query?: string;
    status?: "pending" | "active" | "suspended";
    limit?: number;
    cursor?: string;
  }): Promise<ProProfileEntity[]> {
    const where: {
      status?: "pending" | "active" | "suspended";
      OR?: Array<{
        displayName?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.query) {
      where.OR = [
        { displayName: { contains: filters.query, mode: "insensitive" } },
        { email: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    const proProfiles = await prisma.proProfile.findMany({
      where,
      take: filters?.limit,
      cursor: filters?.cursor ? { id: filters.cursor } : undefined,
      skip: filters?.cursor ? 1 : undefined,
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
    // Build update data object, only including provided fields
    const updateData: {
      displayName?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      hourlyRate?: number;
      categories?: Category[];
      serviceArea?: string | null;
    } = {};

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone ?? null;
    }
    if (data.bio !== undefined) {
      updateData.bio = data.bio ?? null;
    }
    if (data.hourlyRate !== undefined) {
      updateData.hourlyRate = data.hourlyRate;
    }
    if (data.categories !== undefined) {
      updateData.categories = data.categories as Category[]; // Prisma expects Category[] enum
    }
    if (data.serviceArea !== undefined) {
      updateData.serviceArea = data.serviceArea ?? null;
    }

    const proProfile = await prisma.proProfile.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToDomain(proProfile);
  }

  private mapPrismaToDomain(prismaProProfile: {
    id: string;
    userId: string;
    displayName: string;
    email: string;
    phone: string | null;
    bio: string | null;
    hourlyRate: number;
    categories: string[] | Category[]; // Prisma returns Category[] enum, but we convert to string[]
    serviceArea: string | null;
    status: string; // Prisma returns ProStatus enum (pending | active | suspended)
    createdAt: Date;
    updatedAt: Date;
  }): ProProfileEntity {
    return {
      id: prismaProProfile.id,
      userId: prismaProProfile.userId,
      displayName: prismaProProfile.displayName,
      email: prismaProProfile.email ?? "",
      phone: prismaProProfile.phone ?? null,
      bio: prismaProProfile.bio ?? null,
      hourlyRate: prismaProProfile.hourlyRate,
      categories: (prismaProProfile.categories ?? []) as string[],
      serviceArea: prismaProProfile.serviceArea ?? null,
      status: prismaProProfile.status as "pending" | "active" | "suspended",
      createdAt: prismaProProfile.createdAt,
      updatedAt: prismaProProfile.updatedAt,
    };
  }
}

export const proRepository: ProRepository = new ProRepositoryImpl();

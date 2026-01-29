import { injectable, inject } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { calculateProfileCompleted } from "./pro.calculations";
import { TOKENS } from "@/server/container/tokens";
import type { ProProfileCategoryRepository } from "./proProfileCategory.repo";
import type { CategoryRepository } from "../category/category.repo";

// Type representing what Prisma returns for ProProfile queries
// Union of all possible return types from Prisma queries
type PrismaProProfile =
  | NonNullable<Awaited<ReturnType<typeof prisma.proProfile.findUnique>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.proProfile.create>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.proProfile.update>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.proProfile.findMany>>[0]>;

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
  avatarUrl: string | null;
  hourlyRate: number;
  categoryIds: string[]; // FK to Category table via junction table
  serviceArea: string | null;
  status: "pending" | "active" | "suspended";
  profileCompleted: boolean;
  completedJobsCount: number;
  isTopPro: boolean;
  responseTimeMinutes: number | null;
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
  avatarUrl?: string | null;
  hourlyRate: number;
  categoryIds: string[]; // FK to Category table (required)
  serviceArea?: string;
}

/**
 * ProProfile update input
 * Allows updating regular fields and calculated fields (for internal use)
 */
export interface ProProfileUpdateInput {
  displayName?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  hourlyRate?: number;
  categoryIds?: string[]; // FK to Category table
  serviceArea?: string | null;
  profileCompleted?: boolean;
  completedJobsCount?: number;
  isTopPro?: boolean;
  responseTimeMinutes?: number | null;
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
  searchPros(filters: {
    categoryId?: string; // FK to Category table
    profileCompleted?: boolean;
  }): Promise<ProProfileEntity[]>;
  updateStatus(
    id: string,
    status: "pending" | "active" | "suspended"
  ): Promise<ProProfileEntity | null>;
  update(
    id: string,
    data: ProProfileUpdateInput
  ): Promise<ProProfileEntity | null>;
}

/**
 * ProProfile repository implementation using Prisma
 */
@injectable()
export class ProRepositoryImpl implements ProRepository {
  constructor(
    @inject(TOKENS.ProProfileCategoryRepository)
    private readonly proProfileCategoryRepository: ProProfileCategoryRepository,
    @inject(TOKENS.CategoryRepository)
    private readonly categoryRepository: CategoryRepository
  ) {}

  async create(input: ProProfileCreateInput): Promise<ProProfileEntity> {
    const proProfile = await prisma.proProfile.create({
      data: {
        userId: input.userId,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone ?? null,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl ?? null,
        hourlyRate: input.hourlyRate,
        serviceArea: input.serviceArea ?? null,
        status: "pending",
        // profileCompleted will be calculated based on avatarUrl and bio presence
        profileCompleted: calculateProfileCompleted(input.avatarUrl, input.bio),
      },
    });

    // Create junction table records for categories
    if (input.categoryIds.length > 0) {
      await this.proProfileCategoryRepository.bulkCreate(
        proProfile.id,
        input.categoryIds
      );
    }

    // Fetch with relations to get categoryIds
    const result = await this.findById(proProfile.id);
    if (!result) {
      throw new Error("Failed to create pro profile");
    }
    return result;
  }

  async findById(id: string): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.findUnique({
      where: { id },
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null, // Filter out soft-deleted categories
            },
          },
        },
      },
    });

    return proProfile ? await this.mapPrismaToDomainAsync(proProfile) : null;
  }

  async findByUserId(userId: string): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.findUnique({
      where: { userId },
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
    });

    if (!proProfile) return null;
    return await this.mapPrismaToDomainAsync(proProfile);
  }

  async findAll(): Promise<ProProfileEntity[]> {
    // Only return pros with completed profiles for public visibility
    const proProfiles = await prisma.proProfile.findMany({
      where: {
        profileCompleted: true,
      },
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(proProfiles.map((p) => this.mapPrismaToDomainAsync(p)));
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
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
      take: filters?.limit,
      cursor: filters?.cursor ? { id: filters.cursor } : undefined,
      skip: filters?.cursor ? 1 : undefined,
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(proProfiles.map((p) => this.mapPrismaToDomainAsync(p)));
  }

  async searchPros(filters: {
    categoryId?: string; // FK to Category table
    profileCompleted?: boolean;
  }): Promise<ProProfileEntity[]> {
    const where: {
      status: "active";
      profileCompleted?: boolean;
      categoryRelations?: {
        some: {
          categoryId: string;
          category: {
            deletedAt: null;
          };
        };
      };
    } = {
      status: "active",
    };

    // Filter by profileCompleted (defaults to true for public search)
    if (filters.profileCompleted !== undefined) {
      where.profileCompleted = filters.profileCompleted;
    } else {
      // Default to only completed profiles for public search
      where.profileCompleted = true;
    }

    // Filter by categoryId if provided
    if (filters.categoryId) {
      where.categoryRelations = {
        some: {
          categoryId: filters.categoryId,
          category: {
            deletedAt: null, // Filter out soft-deleted categories
          },
        },
      };
    }

    const proProfiles = await prisma.proProfile.findMany({
      where,
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(proProfiles.map((p) => this.mapPrismaToDomainAsync(p)));
  }

  async updateStatus(
    id: string,
    status: "pending" | "active" | "suspended"
  ): Promise<ProProfileEntity | null> {
    const proProfile = await prisma.proProfile.update({
      where: { id },
      data: { status },
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
    });

    return await this.mapPrismaToDomainAsync(proProfile);
  }

  async update(
    id: string,
    data: ProProfileUpdateInput
  ): Promise<ProProfileEntity | null> {
    // Fetch current profile to get existing values for profileCompleted calculation
    const currentProfile = await prisma.proProfile.findUnique({
      where: { id },
      select: { avatarUrl: true, bio: true },
    });

    if (!currentProfile) {
      return null;
    }

    // Handle categoryIds update
    if (data.categoryIds !== undefined) {
      // Delete all existing category relations
      await this.proProfileCategoryRepository.deleteByProProfileId(id);
      // Create new relations
      if (data.categoryIds.length > 0) {
        await this.proProfileCategoryRepository.bulkCreate(
          id,
          data.categoryIds
        );
      }
    }

    // Build update data object, only including provided fields
    const updateData: {
      displayName?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      hourlyRate?: number;
      serviceArea?: string | null;
      profileCompleted?: boolean;
      completedJobsCount?: number;
      isTopPro?: boolean;
      responseTimeMinutes?: number | null;
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
    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl ?? null;
    }
    if (data.hourlyRate !== undefined) {
      updateData.hourlyRate = data.hourlyRate;
    }
    if (data.serviceArea !== undefined) {
      updateData.serviceArea = data.serviceArea ?? null;
    }
    if (data.completedJobsCount !== undefined) {
      updateData.completedJobsCount = data.completedJobsCount;
    }
    if (data.isTopPro !== undefined) {
      updateData.isTopPro = data.isTopPro;
    }
    if (data.responseTimeMinutes !== undefined) {
      updateData.responseTimeMinutes = data.responseTimeMinutes ?? null;
    }

    // Recalculate profileCompleted if avatarUrl or bio is being updated
    if (data.avatarUrl !== undefined || data.bio !== undefined) {
      const finalAvatarUrl =
        data.avatarUrl !== undefined
          ? data.avatarUrl
          : currentProfile.avatarUrl;
      const finalBio = data.bio !== undefined ? data.bio : currentProfile.bio;
      updateData.profileCompleted = calculateProfileCompleted(
        finalAvatarUrl,
        finalBio
      );
    } else if (data.profileCompleted !== undefined) {
      // Only allow manual override if avatarUrl/bio are not being updated
      updateData.profileCompleted = data.profileCompleted;
    }

    const proProfile = await prisma.proProfile.update({
      where: { id },
      data: updateData,
      include: {
        categoryRelations: {
          include: {
            category: true,
          },
          where: {
            category: {
              deletedAt: null,
            },
          },
        },
      },
    });

    return await this.mapPrismaToDomainAsync(proProfile);
  }

  /**
   * Map Prisma ProProfile to domain entity (async to derive categories from categoryIds)
   */
  private async mapPrismaToDomainAsync(
    prismaProProfile: NonNullable<PrismaProProfile> & {
      categoryRelations?: Array<{
        id: string;
        proProfileId: string;
        categoryId: string;
        category?: {
          id: string;
          key: string;
        } | null;
      }>;
    }
  ): Promise<ProProfileEntity> {
    const p = prismaProProfile;

    // Get categoryIds from junction table
    const categoryIds = p.categoryRelations?.map((rel) => rel.categoryId) ?? [];

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      email: p.email ?? "",
      phone: p.phone ?? null,
      bio: p.bio ?? null,
      avatarUrl: p.avatarUrl ?? null,
      hourlyRate: p.hourlyRate,
      categoryIds, // FK array
      serviceArea: p.serviceArea ?? null,
      status: p.status as "pending" | "active" | "suspended",
      profileCompleted: p.profileCompleted,
      completedJobsCount: p.completedJobsCount,
      isTopPro: p.isTopPro,
      responseTimeMinutes: p.responseTimeMinutes ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}

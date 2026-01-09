import { prisma } from "../db/prisma";

/**
 * Availability entity (plain object)
 */
export interface AvailabilityEntity {
  id: string;
  proProfileId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Availability create input
 */
export interface AvailabilityCreateInput {
  proProfileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Availability repository interface
 * Handles all data access for pro availability
 */
export interface AvailabilityRepository {
  create(input: AvailabilityCreateInput): Promise<AvailabilityEntity>;
  findById(id: string): Promise<AvailabilityEntity | null>;
  findByProProfileId(proProfileId: string): Promise<AvailabilityEntity[]>;
  delete(id: string): Promise<void>;
  deleteByProProfileId(proProfileId: string): Promise<void>;
}

/**
 * Availability repository implementation using Prisma
 */
class AvailabilityRepositoryImpl implements AvailabilityRepository {
  async create(input: AvailabilityCreateInput): Promise<AvailabilityEntity> {
    const availability = await prisma.availability.create({
      data: {
        proProfileId: input.proProfileId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });

    return this.mapPrismaToDomain(availability);
  }

  async findById(id: string): Promise<AvailabilityEntity | null> {
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    return availability ? this.mapPrismaToDomain(availability) : null;
  }

  async findByProProfileId(
    proProfileId: string
  ): Promise<AvailabilityEntity[]> {
    const availabilities = await prisma.availability.findMany({
      where: { proProfileId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return availabilities.map(this.mapPrismaToDomain);
  }

  async delete(id: string): Promise<void> {
    await prisma.availability.delete({
      where: { id },
    });
  }

  async deleteByProProfileId(proProfileId: string): Promise<void> {
    await prisma.availability.deleteMany({
      where: { proProfileId },
    });
  }

  private mapPrismaToDomain(prismaAvailability: {
    id: string;
    proProfileId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    createdAt: Date;
    updatedAt: Date;
  }): AvailabilityEntity {
    return {
      id: prismaAvailability.id,
      proProfileId: prismaAvailability.proProfileId,
      dayOfWeek: prismaAvailability.dayOfWeek,
      startTime: prismaAvailability.startTime,
      endTime: prismaAvailability.endTime,
      createdAt: prismaAvailability.createdAt,
      updatedAt: prismaAvailability.updatedAt,
    };
  }
}

export const availabilityRepository: AvailabilityRepository =
  new AvailabilityRepositoryImpl();

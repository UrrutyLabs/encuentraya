import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Role } from "@repo/domain";

/**
 * User entity (plain object)
 */
export interface UserEntity {
  id: string;
  role: Role;
  deletedAt: Date | null;
  createdAt: Date;
}

/**
 * User repository interface
 * Handles all data access for users
 */
export interface UserRepository {
  create(role: Role, id?: string): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByRole(role: Role): Promise<UserEntity[]>;
  updateRole(id: string, role: Role): Promise<UserEntity>;
  softDelete(id: string): Promise<UserEntity>;
}

/**
 * User repository implementation using Prisma
 */
@injectable()
export class UserRepositoryImpl implements UserRepository {
  async create(role: Role, id?: string): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: id
        ? {
            id, // Use provided ID (e.g., Supabase user ID)
            role,
          }
        : {
            // Let Prisma generate ID
            role,
          },
    });

    return this.mapPrismaToDomain(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null, // Filter out soft-deleted users
      },
    });

    return user ? this.mapPrismaToDomain(user) : null;
  }

  async findByRole(role: Role): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      where: {
        role,
        deletedAt: null, // Filter out soft-deleted users
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(this.mapPrismaToDomain);
  }

  async updateRole(id: string, role: Role): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return this.mapPrismaToDomain(user);
  }

  async softDelete(id: string): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapPrismaToDomain(user);
  }

  private mapPrismaToDomain(prismaUser: {
    id: string;
    role: string;
    deletedAt: Date | null;
    createdAt: Date;
  }): UserEntity {
    return {
      id: prismaUser.id,
      role: prismaUser.role as Role,
      deletedAt: prismaUser.deletedAt,
      createdAt: prismaUser.createdAt,
    };
  }
}

export const userRepository: UserRepository = new UserRepositoryImpl();

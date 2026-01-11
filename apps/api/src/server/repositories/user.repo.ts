import { prisma } from "../db/prisma";
import { Role } from "@repo/domain";

/**
 * User entity (plain object)
 */
export interface UserEntity {
  id: string;
  role: Role;
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
}

/**
 * User repository implementation using Prisma
 */
class UserRepositoryImpl implements UserRepository {
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
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapPrismaToDomain(user) : null;
  }

  async findByRole(role: Role): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      where: { role },
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

  private mapPrismaToDomain(prismaUser: {
    id: string;
    role: string;
    createdAt: Date;
  }): UserEntity {
    return {
      id: prismaUser.id,
      role: prismaUser.role as Role,
      createdAt: prismaUser.createdAt,
    };
  }
}

export const userRepository: UserRepository = new UserRepositoryImpl();

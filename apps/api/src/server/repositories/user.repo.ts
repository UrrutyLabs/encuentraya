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
  create(role: Role): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByRole(role: Role): Promise<UserEntity[]>;
}

/**
 * User repository implementation using Prisma
 */
class UserRepositoryImpl implements UserRepository {
  async create(role: Role): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
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

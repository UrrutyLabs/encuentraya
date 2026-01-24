import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Role } from "@repo/domain";
import type { Prisma, $Enums } from "@infra/db/prisma";

/**
 * Audit event type enum
 */
export enum AuditEventType {
  PRO_SUSPENDED = "PRO_SUSPENDED",
  PRO_UNSUSPENDED = "PRO_UNSUSPENDED",
  PRO_APPROVED = "PRO_APPROVED",
  BOOKING_STATUS_FORCED = "BOOKING_STATUS_FORCED",
  PAYMENT_SYNCED = "PAYMENT_SYNCED",
  PAYOUT_CREATED = "PAYOUT_CREATED",
  PAYOUT_SENT = "PAYOUT_SENT",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
}

/**
 * Audit log entity (plain object)
 */
export interface AuditLogEntity {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorRole: Role;
  resourceType: string;
  resourceId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Audit log create input
 */
export interface AuditLogCreateInput {
  eventType: AuditEventType;
  actorId: string;
  actorRole: Role;
  resourceType: string;
  resourceId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log repository interface
 * Handles all data access for audit logs
 */
export interface AuditLogRepository {
  createLog(input: AuditLogCreateInput): Promise<AuditLogEntity>;
  findByResource(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLogEntity[]>;
  findByActor(actorId: string): Promise<AuditLogEntity[]>;
  findByEventType(eventType: AuditEventType): Promise<AuditLogEntity[]>;
}

/**
 * Audit log repository implementation using Prisma
 */
@injectable()
export class AuditLogRepositoryImpl implements AuditLogRepository {
  async createLog(input: AuditLogCreateInput): Promise<AuditLogEntity> {
    const log = await prisma.auditLog.create({
      data: {
        eventType: input.eventType as unknown as $Enums.AuditEventType,
        actorId: input.actorId,
        actorRole: input.actorRole as unknown as $Enums.Role,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        action: input.action,
        metadata: input.metadata ? (input.metadata as object) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });

    return this.mapPrismaToDomain(log);
  }

  async findByResource(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLogEntity[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { createdAt: "desc" },
    });

    return logs.map(this.mapPrismaToDomain);
  }

  async findByActor(actorId: string): Promise<AuditLogEntity[]> {
    const logs = await prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: "desc" },
    });

    return logs.map(this.mapPrismaToDomain);
  }

  async findByEventType(eventType: AuditEventType): Promise<AuditLogEntity[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        eventType: eventType as unknown as $Enums.AuditEventType,
      },
      orderBy: { createdAt: "desc" },
    });

    return logs.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(
    prismaLog: Prisma.AuditLogGetPayload<Record<string, never>>
  ): AuditLogEntity {
    return {
      id: prismaLog.id,
      eventType: prismaLog.eventType as AuditEventType,
      actorId: prismaLog.actorId,
      actorRole: prismaLog.actorRole as Role,
      resourceType: prismaLog.resourceType,
      resourceId: prismaLog.resourceId,
      action: prismaLog.action,
      metadata: prismaLog.metadata as Record<string, unknown> | null,
      ipAddress: prismaLog.ipAddress,
      userAgent: prismaLog.userAgent,
      createdAt: prismaLog.createdAt,
    };
  }
}

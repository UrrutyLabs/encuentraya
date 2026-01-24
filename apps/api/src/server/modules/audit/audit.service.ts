import { injectable, inject } from "tsyringe";
import type { AuditLogRepository, AuditEventType } from "./audit.repo";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import { TOKENS } from "../../container/tokens";
import { logger } from "@infra/utils/logger";

/**
 * Audit service
 * Provides centralized audit logging for admin actions and important events
 */
@injectable()
export class AuditService {
  constructor(
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  /**
   * Log an audit event
   * Stores in database and logs to application logger
   */
  async logEvent(input: {
    eventType: AuditEventType;
    actor: Actor;
    resourceType: string;
    resourceId: string;
    action: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Store in database
      await this.auditLogRepository.createLog({
        eventType: input.eventType,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        action: input.action,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      // Also log to application logger for immediate visibility
      logger.info(
        {
          eventType: input.eventType,
          actorId: input.actor.id,
          actorRole: input.actor.role,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          action: input.action,
          metadata: input.metadata,
        },
        `Audit: ${input.action} on ${input.resourceType} ${input.resourceId}`
      );
    } catch (error) {
      // Log error but don't throw - audit logging should not break the main operation
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          input,
        },
        "Failed to create audit log"
      );
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: string
  ): Promise<
    Array<{
      id: string;
      eventType: AuditEventType;
      actorId: string;
      actorRole: Role;
      action: string;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }>
  > {
    const logs = await this.auditLogRepository.findByResource(
      resourceType,
      resourceId
    );

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      actorId: log.actorId,
      actorRole: log.actorRole,
      action: log.action,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get audit logs for a specific actor (admin user)
   */
  async getActorLogs(actorId: string): Promise<
    Array<{
      id: string;
      eventType: AuditEventType;
      resourceType: string;
      resourceId: string;
      action: string;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }>
  > {
    const logs = await this.auditLogRepository.findByActor(actorId);

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      action: log.action,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }
}

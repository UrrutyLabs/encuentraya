import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuditService } from "../audit.service";
import type { AuditLogRepository } from "../audit.repo";
import { AuditEventType } from "../audit.repo";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import * as loggerModule from "@infra/utils/logger";

// Mock logger
vi.mock("@infra/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AuditService", () => {
  let service: AuditService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  function createMockRepository(): {
    createLog: ReturnType<typeof vi.fn>;
    findByResource: ReturnType<typeof vi.fn>;
    findByActor: ReturnType<typeof vi.fn>;
  } {
    return {
      createLog: vi.fn(),
      findByResource: vi.fn(),
      findByActor: vi.fn(),
    };
  }

  function createMockActor(role: Role = Role.ADMIN, id = "actor-1"): Actor {
    return { id, role };
  }

  function createMockAuditLog(
    overrides?: Partial<{
      id: string;
      eventType: AuditEventType;
      actorId: string;
      actorRole: Role;
      resourceType: string;
      resourceId: string;
      action: string;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }>
  ) {
    return {
      id: "log-1",
      eventType: AuditEventType.BOOKING_STATUS_FORCED,
      actorId: "actor-1",
      actorRole: Role.ADMIN,
      resourceType: "booking",
      resourceId: "booking-1",
      action: "force_status",
      metadata: { previousStatus: "PENDING", newStatus: "COMPLETED" },
      createdAt: new Date("2024-01-01"),
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new AuditService(mockRepository as unknown as AuditLogRepository);
    vi.clearAllMocks();
  });

  describe("logEvent", () => {
    it("should create audit log and log to application logger", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        eventType: AuditEventType.BOOKING_STATUS_FORCED,
        actor,
        resourceType: "booking",
        resourceId: "booking-1",
        action: "force_status",
        metadata: { previousStatus: "PENDING", newStatus: "COMPLETED" },
      };
      const mockLog = createMockAuditLog();
      mockRepository.createLog.mockResolvedValue(mockLog);

      // Act
      await service.logEvent(input);

      // Assert
      expect(mockRepository.createLog).toHaveBeenCalledWith({
        eventType: input.eventType,
        actorId: actor.id,
        actorRole: actor.role,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        action: input.action,
        metadata: input.metadata,
        ipAddress: undefined,
        userAgent: undefined,
      });
      expect(loggerModule.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: input.eventType,
          actorId: actor.id,
          actorRole: actor.role,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          action: input.action,
        }),
        `Audit: ${input.action} on ${input.resourceType} ${input.resourceId}`
      );
    });

    it("should include ipAddress and userAgent when provided", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        eventType: AuditEventType.PRO_SUSPENDED,
        actor,
        resourceType: "pro",
        resourceId: "pro-1",
        action: "suspend",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      };
      mockRepository.createLog.mockResolvedValue(createMockAuditLog());

      // Act
      await service.logEvent(input);

      // Assert
      expect(mockRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        })
      );
    });

    it("should not throw error when repository fails (audit should not break main operation)", async () => {
      // Arrange
      const actor = createMockActor();
      const input = {
        eventType: AuditEventType.PAYOUT_CREATED,
        actor,
        resourceType: "payout",
        resourceId: "payout-1",
        action: "create",
      };
      const error = new Error("Database error");
      mockRepository.createLog.mockRejectedValue(error);

      // Act & Assert - should not throw
      await expect(service.logEvent(input)).resolves.not.toThrow();

      // Should log error
      expect(loggerModule.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database error",
        }),
        "Failed to create audit log"
      );
    });
  });

  describe("getResourceLogs", () => {
    it("should return audit logs for a resource", async () => {
      // Arrange
      const resourceType = "booking";
      const resourceId = "booking-1";
      const mockLogs = [
        createMockAuditLog({ id: "log-1", action: "force_status" }),
        createMockAuditLog({
          id: "log-2",
          action: "update",
          eventType: AuditEventType.PAYMENT_SYNCED,
        }),
      ];
      mockRepository.findByResource.mockResolvedValue(mockLogs);

      // Act
      const result = await service.getResourceLogs(resourceType, resourceId);

      // Assert
      expect(mockRepository.findByResource).toHaveBeenCalledWith(
        resourceType,
        resourceId
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "log-1",
        eventType: AuditEventType.BOOKING_STATUS_FORCED,
        actorId: "actor-1",
        actorRole: Role.ADMIN,
        action: "force_status",
        metadata: expect.any(Object),
        createdAt: expect.any(Date),
      });
    });

    it("should return empty array when no logs found", async () => {
      // Arrange
      mockRepository.findByResource.mockResolvedValue([]);

      // Act
      const result = await service.getResourceLogs("booking", "booking-1");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("getActorLogs", () => {
    it("should return audit logs for an actor", async () => {
      // Arrange
      const actorId = "actor-1";
      const mockLogs = [
        createMockAuditLog({ id: "log-1", actorId }),
        createMockAuditLog({ id: "log-2", actorId, resourceType: "pro" }),
      ];
      mockRepository.findByActor.mockResolvedValue(mockLogs);

      // Act
      const result = await service.getActorLogs(actorId);

      // Assert
      expect(mockRepository.findByActor).toHaveBeenCalledWith(actorId);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "log-1",
        eventType: AuditEventType.BOOKING_STATUS_FORCED,
        resourceType: "booking",
        resourceId: "booking-1",
        action: "force_status",
        metadata: expect.any(Object),
        createdAt: expect.any(Date),
      });
    });

    it("should return empty array when actor has no logs", async () => {
      // Arrange
      mockRepository.findByActor.mockResolvedValue([]);

      // Act
      const result = await service.getActorLogs("actor-1");

      // Assert
      expect(result).toEqual([]);
    });
  });
});

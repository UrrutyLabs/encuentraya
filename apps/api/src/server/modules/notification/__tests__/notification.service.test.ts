import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationService } from "../notification.service";
import type { NotificationDeliveryRepository, NotificationDeliveryEntity } from "../notificationDelivery.repo";
import type { NotificationMessage, NotificationProvider } from "../provider";
import { $Enums } from "@infra/db/prisma";
import * as registryModule from "../registry";

// Use enum values directly to avoid issues with mocked $Enums
const NotificationChannel = {
  EMAIL: "EMAIL" as const,
  WHATSAPP: "WHATSAPP" as const,
  PUSH: "PUSH" as const,
};

const NotificationDeliveryStatus = {
  QUEUED: "QUEUED" as const,
  SENT: "SENT" as const,
  FAILED: "FAILED" as const,
};

// Mock notification provider registry
vi.mock("../registry", () => ({
  getNotificationProvider: vi.fn(),
}));

describe("NotificationService", () => {
  let service: NotificationService;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let mockProvider: ReturnType<typeof createMockProvider>;

  function createMockRepository(): {
    findByIdempotencyKey: ReturnType<typeof vi.fn>;
    createQueued: ReturnType<typeof vi.fn>;
    incrementAttempt: ReturnType<typeof vi.fn>;
    markSent: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
    listQueued: ReturnType<typeof vi.fn>;
  } {
    return {
      findByIdempotencyKey: vi.fn(),
      createQueued: vi.fn(),
      incrementAttempt: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      listQueued: vi.fn(),
    };
  }

  function createMockProvider(): {
    send: ReturnType<typeof vi.fn>;
  } {
    return {
      send: vi.fn(),
    };
  }

  function createMockDelivery(overrides?: Partial<NotificationDeliveryEntity>): NotificationDeliveryEntity {
    return {
      id: "delivery-1",
      channel: NotificationChannel.EMAIL as $Enums.NotificationChannel,
      recipientRef: "user-1",
      templateId: "welcome-email",
      payload: { name: "John" },
      idempotencyKey: "key-1",
      provider: null,
      providerMessageId: null,
      status: NotificationDeliveryStatus.QUEUED as $Enums.NotificationDeliveryStatus,
      error: null,
      attemptCount: 0,
      lastAttemptAt: null,
      createdAt: new Date(),
      sentAt: null,
      failedAt: null,
      ...overrides,
    };
  }

  function createMockMessage(overrides?: Partial<NotificationMessage>): NotificationMessage {
    return {
      channel: "EMAIL",
      recipientRef: "user-1",
      templateId: "welcome-email",
      payload: { name: "John" },
      idempotencyKey: "key-1",
      ...overrides,
    };
  }

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockProvider = createMockProvider();
    service = new NotificationService(mockRepository as unknown as NotificationDeliveryRepository);
    vi.clearAllMocks();
  });

  describe("enqueue", () => {
    it("should return existing delivery when idempotencyKey exists", async () => {
      // Arrange
      const message = createMockMessage();
      const existingDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });
      mockRepository.findByIdempotencyKey.mockResolvedValue(existingDelivery);

      // Act
      const result = await service.enqueue(message);

      // Assert
      expect(mockRepository.findByIdempotencyKey).toHaveBeenCalledWith(message.idempotencyKey);
      expect(mockRepository.createQueued).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: existingDelivery.id,
        channel: existingDelivery.channel,
        recipientRef: existingDelivery.recipientRef,
        templateId: existingDelivery.templateId,
        payload: existingDelivery.payload,
        idempotencyKey: existingDelivery.idempotencyKey,
        status: existingDelivery.status,
      });
    });

    it("should create new queued delivery when idempotencyKey does not exist", async () => {
      // Arrange
      const message = createMockMessage();
      const newDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: NotificationDeliveryStatus.QUEUED as $Enums.NotificationDeliveryStatus,
      });
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.createQueued.mockResolvedValue(newDelivery);

      // Act
      const result = await service.enqueue(message);

      // Assert
      expect(mockRepository.findByIdempotencyKey).toHaveBeenCalledWith(message.idempotencyKey);
      expect(mockRepository.createQueued).toHaveBeenCalledWith({
        channel: message.channel as $Enums.NotificationChannel,
        recipientRef: message.recipientRef,
        templateId: message.templateId,
        payload: message.payload,
        idempotencyKey: message.idempotencyKey,
      });
      expect(result).toEqual({
        id: newDelivery.id,
        channel: newDelivery.channel,
        recipientRef: newDelivery.recipientRef,
        templateId: newDelivery.templateId,
        payload: newDelivery.payload,
        idempotencyKey: newDelivery.idempotencyKey,
        status: newDelivery.status,
      });
    });
  });

  describe("deliverNow", () => {
    it("should return existing delivery when already sent", async () => {
      // Arrange
      const message = createMockMessage();
      const sentDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
        provider: "sendgrid",
        providerMessageId: "msg-123",
      });
      mockRepository.findByIdempotencyKey.mockResolvedValue(sentDelivery);

      // Act
      const result = await service.deliverNow(message);

      // Assert
      expect(result).toEqual({
        id: sentDelivery.id,
        status: sentDelivery.status,
        provider: sentDelivery.provider ?? undefined,
        providerMessageId: sentDelivery.providerMessageId ?? undefined,
      });
      expect(mockRepository.incrementAttempt).not.toHaveBeenCalled();
      expect(mockProvider.send).not.toHaveBeenCalled();
    });

    it("should deliver notification successfully", async () => {
      // Arrange
      const message = createMockMessage();
      const queuedDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: $Enums.NotificationDeliveryStatus.QUEUED,
      });
      const updatedDelivery = createMockDelivery({
        ...queuedDelivery,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
      const sentDelivery = createMockDelivery({
        ...updatedDelivery,
        status: NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
        provider: "sendgrid",
        providerMessageId: "msg-123",
        sentAt: new Date(),
      });

      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.createQueued.mockResolvedValue(queuedDelivery);
      mockRepository.incrementAttempt.mockResolvedValue(updatedDelivery);
      mockRepository.markSent.mockResolvedValue(sentDelivery);
      vi.mocked(registryModule.getNotificationProvider).mockReturnValue(mockProvider as NotificationProvider);
      mockProvider.send.mockResolvedValue({
        provider: "sendgrid",
        providerMessageId: "msg-123",
      });

      // Act
      const result = await service.deliverNow(message);

      // Assert
      expect(mockRepository.incrementAttempt).toHaveBeenCalledWith(queuedDelivery.id, expect.any(Date));
      expect(vi.mocked(registryModule.getNotificationProvider)).toHaveBeenCalledWith(message.channel);
      expect(mockProvider.send).toHaveBeenCalledWith(message);
      expect(mockRepository.markSent).toHaveBeenCalledWith(queuedDelivery.id, {
        provider: "sendgrid",
        providerMessageId: "msg-123",
        sentAt: expect.any(Date),
      });
      expect(result).toEqual({
        id: sentDelivery.id,
        status: sentDelivery.status,
        provider: sentDelivery.provider ?? undefined,
        providerMessageId: sentDelivery.providerMessageId ?? undefined,
      });
    });

    it("should mark as failed when provider throws error", async () => {
      // Arrange
      const message = createMockMessage();
      const queuedDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: $Enums.NotificationDeliveryStatus.QUEUED,
      });
      const updatedDelivery = createMockDelivery({
        ...queuedDelivery,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
      const failedDelivery = createMockDelivery({
        ...updatedDelivery,
        status: NotificationDeliveryStatus.FAILED as $Enums.NotificationDeliveryStatus,
        error: "Provider error",
        failedAt: new Date(),
      });

      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.createQueued.mockResolvedValue(queuedDelivery);
      mockRepository.incrementAttempt.mockResolvedValue(updatedDelivery);
      mockRepository.markFailed.mockResolvedValue(failedDelivery);
      vi.mocked(registryModule.getNotificationProvider).mockReturnValue(mockProvider as NotificationProvider);
      mockProvider.send.mockRejectedValue(new Error("Provider error"));

      // Act
      const result = await service.deliverNow(message);

      // Assert
      expect(mockProvider.send).toHaveBeenCalledWith(message);
      expect(mockRepository.markFailed).toHaveBeenCalledWith(queuedDelivery.id, {
        error: "Provider error",
        failedAt: expect.any(Date),
      });
      expect(result).toEqual({
        id: failedDelivery.id,
        status: failedDelivery.status,
        error: failedDelivery.error ?? undefined,
      });
    });

    it("should handle non-Error exceptions", async () => {
      // Arrange
      const message = createMockMessage();
      const queuedDelivery = createMockDelivery({
        idempotencyKey: message.idempotencyKey,
        status: $Enums.NotificationDeliveryStatus.QUEUED,
      });
      const updatedDelivery = createMockDelivery({
        ...queuedDelivery,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
      const failedDelivery = createMockDelivery({
        ...updatedDelivery,
        status: NotificationDeliveryStatus.FAILED as $Enums.NotificationDeliveryStatus,
        error: "Unknown error",
        failedAt: new Date(),
      });

      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.createQueued.mockResolvedValue(queuedDelivery);
      mockRepository.incrementAttempt.mockResolvedValue(updatedDelivery);
      mockRepository.markFailed.mockResolvedValue(failedDelivery);
      vi.mocked(registryModule.getNotificationProvider).mockReturnValue(mockProvider as NotificationProvider);
      mockProvider.send.mockRejectedValue("String error");

      // Act
      const result = await service.deliverNow(message);

      // Assert
      expect(mockRepository.markFailed).toHaveBeenCalledWith(queuedDelivery.id, {
        error: "String error",
        failedAt: expect.any(Date),
      });
      expect(result.status).toBe(NotificationDeliveryStatus.FAILED);
    });
  });

  describe("drainQueued", () => {
    it("should process queued notifications and return stats", async () => {
      // Arrange
      const queuedDeliveries = [
        createMockDelivery({
          id: "delivery-1",
          idempotencyKey: "key-1",
          status: NotificationDeliveryStatus.QUEUED as $Enums.NotificationDeliveryStatus,
        }),
        createMockDelivery({
          id: "delivery-2",
          idempotencyKey: "key-2",
          status: NotificationDeliveryStatus.QUEUED as $Enums.NotificationDeliveryStatus,
        }),
      ];

      const sentDelivery1 = createMockDelivery({
        ...queuedDeliveries[0],
        status: NotificationDeliveryStatus.SENT as $Enums.NotificationDeliveryStatus,
      });
      const failedDelivery2 = createMockDelivery({
        ...queuedDeliveries[1],
        status: NotificationDeliveryStatus.FAILED as $Enums.NotificationDeliveryStatus,
      });

      mockRepository.listQueued.mockResolvedValue(queuedDeliveries);
      
      // First delivery succeeds
      mockRepository.findByIdempotencyKey.mockResolvedValueOnce(null);
      mockRepository.createQueued.mockResolvedValueOnce(queuedDeliveries[0]);
      mockRepository.incrementAttempt.mockResolvedValueOnce(queuedDeliveries[0]);
      mockRepository.markSent.mockResolvedValueOnce(sentDelivery1);
      vi.mocked(registryModule.getNotificationProvider).mockReturnValueOnce(mockProvider as NotificationProvider);
      mockProvider.send.mockResolvedValueOnce({ provider: "sendgrid", providerMessageId: "msg-1" });

      // Second delivery fails
      mockRepository.findByIdempotencyKey.mockResolvedValueOnce(null);
      mockRepository.createQueued.mockResolvedValueOnce(queuedDeliveries[1]);
      mockRepository.incrementAttempt.mockResolvedValueOnce(queuedDeliveries[1]);
      mockRepository.markFailed.mockResolvedValueOnce(failedDelivery2);
      vi.mocked(registryModule.getNotificationProvider).mockReturnValueOnce(mockProvider as NotificationProvider);
      mockProvider.send.mockRejectedValueOnce(new Error("Provider error"));

      // Act
      const result = await service.drainQueued(25);

      // Assert
      expect(mockRepository.listQueued).toHaveBeenCalledWith(25);
      expect(result).toEqual({
        processed: 2,
        sent: 1,
        failed: 1,
      });
    });

    it("should return zero stats when no queued notifications", async () => {
      // Arrange
      mockRepository.listQueued.mockResolvedValue([]);

      // Act
      const result = await service.drainQueued(25);

      // Assert
      expect(mockRepository.listQueued).toHaveBeenCalledWith(25);
      expect(result).toEqual({
        processed: 0,
        sent: 0,
        failed: 0,
      });
    });

    it("should use default limit of 25 when limit not provided", async () => {
      // Arrange
      mockRepository.listQueued.mockResolvedValue([]);

      // Act
      await service.drainQueued();

      // Assert
      expect(mockRepository.listQueued).toHaveBeenCalledWith(25);
    });

    it("should use custom limit when provided", async () => {
      // Arrange
      mockRepository.listQueued.mockResolvedValue([]);

      // Act
      await service.drainQueued(50);

      // Assert
      expect(mockRepository.listQueued).toHaveBeenCalledWith(50);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";

// Avoid loading full container (circular deps); ChatService only needs TOKENS for decorators
vi.mock("@/server/container", () => ({
  TOKENS: {
    OrderRepository: "OrderRepository",
    ProRepository: "ProRepository",
    ChatRepository: "ChatRepository",
    ClientProfileRepository: "ClientProfileRepository",
    NotificationService: "NotificationService",
    AuditService: "AuditService",
  },
}));

import { ChatService } from "../chat.service";
import type { OrderRepository, OrderEntity } from "@modules/order/order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { ClientProfileRepository } from "@modules/user/clientProfile.repo";
import type { ChatRepository, OrderMessageEntity } from "../chat.repo";
import type { NotificationService } from "@modules/notification/notification.service";
import type { AuditService } from "@modules/audit/audit.service";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import { OrderStatus } from "@repo/domain";
import { OrderNotFoundError } from "@modules/order/order.errors";
import {
  ChatForbiddenError,
  ChatClosedError,
  ChatContactInfoNotAllowedError,
} from "../chat.errors";
import { AuditEventType } from "@modules/audit/audit.repo";
import * as openaiViolationDetector from "../openai-violation-detector";

vi.mock("../openai-violation-detector", () => ({
  containsContactInfoAsync: vi.fn(),
}));

function createMockOrder(overrides?: Partial<OrderEntity>): OrderEntity {
  return {
    id: "order-1",
    displayId: "100",
    clientUserId: "client-1",
    proProfileId: "pro-1",
    categoryId: "cat-1",
    categoryMetadataJson: null,
    subcategoryId: null,
    title: null,
    description: null,
    addressText: "Address",
    addressLat: null,
    addressLng: null,
    scheduledWindowStartAt: new Date(),
    scheduledWindowEndAt: null,
    status: OrderStatus.ACCEPTED,
    acceptedAt: new Date(),
    confirmedAt: null,
    startedAt: null,
    arrivedAt: null,
    completedAt: null,
    paidAt: null,
    canceledAt: null,
    cancelReason: null,
    pricingMode: "hourly",
    hourlyRateSnapshotAmount: 1000,
    currency: "UYU",
    minHoursSnapshot: null,
    quotedAmountCents: null,
    quotedAt: null,
    quoteMessage: null,
    quoteAcceptedAt: null,
    estimatedHours: 2,
    finalHoursSubmitted: null,
    approvedHours: null,
    approvalMethod: null,
    approvalDeadlineAt: null,
    subtotalAmount: null,
    platformFeeAmount: null,
    taxAmount: null,
    totalAmount: null,
    totalsCalculatedAt: null,
    taxScheme: null,
    taxRate: null,
    taxIncluded: false,
    taxRegion: null,
    taxCalculatedAt: null,
    disputeStatus: "none",
    disputeReason: null,
    disputeOpenedBy: null,
    isFirstOrder: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockActor(role: Role = Role.CLIENT, id = "client-1"): Actor {
  return { id, role };
}

function createMockMessage(
  overrides?: Partial<OrderMessageEntity>
): OrderMessageEntity {
  return {
    id: "msg-1",
    orderId: "order-1",
    senderUserId: "client-1",
    senderRole: "client",
    type: "user",
    text: "Hello",
    attachmentsJson: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("ChatService", () => {
  let service: ChatService;
  let mockOrderRepo: { findById: ReturnType<typeof vi.fn> };
  let mockProRepo: { findById: ReturnType<typeof vi.fn> };
  let mockChatRepo: {
    listByOrder: ReturnType<typeof vi.fn>;
    createMessage: ReturnType<typeof vi.fn>;
  };
  let mockClientProfileRepo: { findByUserId: ReturnType<typeof vi.fn> };
  let mockNotificationService: { deliverNow: ReturnType<typeof vi.fn> };
  let mockAuditService: { logEvent: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockOrderRepo = { findById: vi.fn() };
    mockProRepo = { findById: vi.fn() };
    mockChatRepo = { listByOrder: vi.fn(), createMessage: vi.fn() };
    mockClientProfileRepo = { findByUserId: vi.fn() };
    mockNotificationService = {
      deliverNow: vi.fn().mockResolvedValue(undefined),
    };
    mockAuditService = { logEvent: vi.fn().mockResolvedValue(undefined) };

    service = new ChatService(
      mockOrderRepo as unknown as OrderRepository,
      mockProRepo as unknown as ProRepository,
      mockChatRepo as unknown as ChatRepository,
      mockClientProfileRepo as unknown as ClientProfileRepository,
      mockNotificationService as unknown as NotificationService,
      mockAuditService as unknown as AuditService
    );
    vi.mocked(
      openaiViolationDetector.containsContactInfoAsync
    ).mockResolvedValue(false);
    vi.clearAllMocks();
  });

  describe("listByOrder", () => {
    it("should return messages when actor is client participant", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue({ userId: "pro-user-1" });
      const expected = {
        items: [createMockMessage()],
        nextCursor: null,
      };
      mockChatRepo.listByOrder.mockResolvedValue(expected);

      const result = await service.listByOrder(
        createMockActor(Role.CLIENT, "client-1"),
        "order-1",
        null,
        20
      );

      expect(mockChatRepo.listByOrder).toHaveBeenCalledWith({
        orderId: "order-1",
        cursor: undefined,
        limit: 20,
      });
      expect(result).toEqual(expected);
    });

    it("should return messages when actor is pro participant", async () => {
      const order = createMockOrder({ proProfileId: "pro-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue({ userId: "pro-user-1" });
      const expected = { items: [], nextCursor: null };
      mockChatRepo.listByOrder.mockResolvedValue(expected);

      const result = await service.listByOrder(
        createMockActor(Role.PRO, "pro-user-1"),
        "order-1",
        "cursor-1",
        50
      );

      expect(mockChatRepo.listByOrder).toHaveBeenCalledWith({
        orderId: "order-1",
        cursor: "cursor-1",
        limit: 50,
      });
      expect(result).toEqual(expected);
    });

    it("should throw OrderNotFoundError when order does not exist", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.listByOrder(createMockActor(), "order-1", null, 20)
      ).rejects.toThrow(OrderNotFoundError);

      expect(mockChatRepo.listByOrder).not.toHaveBeenCalled();
    });

    it("should throw ChatForbiddenError when actor is not a participant", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue({ userId: "pro-user-1" });

      await expect(
        service.listByOrder(
          createMockActor(Role.CLIENT, "other-user"),
          "order-1",
          null,
          20
        )
      ).rejects.toThrow(ChatForbiddenError);

      expect(mockChatRepo.listByOrder).not.toHaveBeenCalled();
    });

    it("should cap limit at 100", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue(null);
      mockChatRepo.listByOrder.mockResolvedValue({
        items: [],
        nextCursor: null,
      });

      await service.listByOrder(
        createMockActor(Role.CLIENT, "client-1"),
        "order-1",
        null,
        200
      );

      expect(mockChatRepo.listByOrder).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  describe("send", () => {
    it("should audit and throw when message contains contact info", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue(null);
      vi.mocked(
        openaiViolationDetector.containsContactInfoAsync
      ).mockResolvedValue(true);

      await expect(
        service.send(
          createMockActor(Role.CLIENT, "client-1"),
          "order-1",
          "  call me at 099 123 456  "
        )
      ).rejects.toThrow(ChatContactInfoNotAllowedError);

      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.CHAT_CONTACT_INFO_DETECTED,
        actor: expect.objectContaining({ id: "client-1", role: Role.CLIENT }),
        resourceType: "Order",
        resourceId: "order-1",
        action: "chat_contact_info_blocked",
        metadata: {
          orderId: "order-1",
          orderDisplayId: "100",
          messagePreview: "call me at 099 123 456",
          senderRole: "client",
        },
      });
      expect(mockChatRepo.createMessage).not.toHaveBeenCalled();
    });

    it("should throw ChatClosedError when order is completed and past 24h", async () => {
      const completedAt = new Date();
      completedAt.setHours(completedAt.getHours() - 25);
      const order = createMockOrder({
        clientUserId: "client-1",
        completedAt,
        status: OrderStatus.COMPLETED,
      });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue(null);

      await expect(
        service.send(
          createMockActor(Role.CLIENT, "client-1"),
          "order-1",
          "Hello"
        )
      ).rejects.toThrow(ChatClosedError);

      expect(mockChatRepo.createMessage).not.toHaveBeenCalled();
    });

    it("should create message and return it when chat is open and no contact info", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue(null);
      const createdMessage = createMockMessage({
        id: "msg-new",
        text: "Hello",
      });
      mockChatRepo.createMessage.mockResolvedValue(createdMessage);

      const result = await service.send(
        createMockActor(Role.CLIENT, "client-1"),
        "order-1",
        "  Hello  "
      );

      expect(
        openaiViolationDetector.containsContactInfoAsync
      ).toHaveBeenCalledWith("Hello");
      expect(mockChatRepo.createMessage).toHaveBeenCalledWith({
        orderId: "order-1",
        senderUserId: "client-1",
        senderRole: "client",
        type: "user",
        text: "Hello",
        attachmentsJson: null,
      });
      expect(result).toEqual(createdMessage);
    });

    it("should trim text before checking contact info and saving", async () => {
      const order = createMockOrder({ clientUserId: "client-1" });
      mockOrderRepo.findById.mockResolvedValue(order);
      mockProRepo.findById.mockResolvedValue(null);
      mockChatRepo.createMessage.mockResolvedValue(createMockMessage());

      await service.send(
        createMockActor(Role.CLIENT, "client-1"),
        "order-1",
        "  Hi there  "
      );

      expect(
        openaiViolationDetector.containsContactInfoAsync
      ).toHaveBeenCalledWith("Hi there");
      expect(mockChatRepo.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ text: "Hi there" })
      );
    });
  });
});

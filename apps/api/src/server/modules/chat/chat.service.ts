import { injectable, inject } from "tsyringe";
import { $Enums } from "@infra/db/prisma";
import { OrderStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import type { OrderRepository, OrderEntity } from "@modules/order/order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { ClientProfileRepository } from "@modules/user/clientProfile.repo";
import type { ChatRepository, OrderMessageEntity } from "./chat.repo";
import type { NotificationService } from "@modules/notification/notification.service";
import { buildNotificationMessages } from "@modules/notification/policy";
import { TOKENS } from "@/server/container";
import { OrderNotFoundError } from "@modules/order/order.errors";
import { ChatForbiddenError, ChatClosedError } from "./chat.errors";

const CHAT_CLOSE_HOURS_AFTER_COMPLETED = 24;

/**
 * Resolves whether the actor is the client or the pro for the order.
 * Returns "client" | "pro" or null if not a participant.
 */
function resolveParticipant(
  order: OrderEntity,
  proUserId: string | null,
  actorId: string
): "client" | "pro" | null {
  if (order.clientUserId === actorId) return "client";
  if (proUserId === actorId) return "pro";
  return null;
}

/**
 * Chat is open if: order is not canceled, and either no completedAt or now is within 24h of completedAt.
 */
function isChatOpen(order: OrderEntity, now: Date): boolean {
  if (order.status === OrderStatus.CANCELED || order.canceledAt) return false;
  if (!order.completedAt) return true;
  const closeAt = new Date(order.completedAt);
  closeAt.setHours(closeAt.getHours() + CHAT_CLOSE_HOURS_AFTER_COMPLETED);
  return now <= closeAt;
}

const CHAT_MESSAGE_TEMPLATE_ID = "chat.new_message";
const TEXT_PREVIEW_MAX_LEN = 100;

@injectable()
export class ChatService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ChatRepository)
    private readonly chatRepository: ChatRepository,
    @inject(TOKENS.ClientProfileRepository)
    private readonly clientProfileRepository: ClientProfileRepository,
    @inject(TOKENS.NotificationService)
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Ensures the actor is a participant of the order and returns the order entity and participant role.
   */
  private async assertParticipant(
    actor: Actor,
    orderId: string
  ): Promise<{ order: OrderEntity; role: "client" | "pro" }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    let proUserId: string | null = null;
    if (order.proProfileId) {
      const pro = await this.proRepository.findById(order.proProfileId);
      proUserId = pro?.userId ?? null;
    }

    const role = resolveParticipant(order, proUserId, actor.id);
    if (!role) throw new ChatForbiddenError(orderId);
    return { order, role };
  }

  /**
   * List messages for an order (cursor pagination). Allowed for participants only.
   * Works for open and closed threads (read-only history after close).
   */
  async listByOrder(
    actor: Actor,
    orderId: string,
    cursor: string | null,
    limit: number
  ): Promise<{ items: OrderMessageEntity[]; nextCursor: string | null }> {
    await this.assertParticipant(actor, orderId);
    return this.chatRepository.listByOrder({
      orderId,
      cursor: cursor ?? undefined,
      limit: Math.min(limit || 20, 100),
    });
  }

  /**
   * Send a text message. Only allowed when chat is open.
   * Notifies the other participant (PUSH for pro, EMAIL/WHATSAPP for client per policy).
   */
  async send(
    actor: Actor,
    orderId: string,
    text: string,
    attachmentsJson?: Record<string, unknown> | null
  ): Promise<OrderMessageEntity> {
    const { order, role } = await this.assertParticipant(actor, orderId);
    const now = new Date();
    if (!isChatOpen(order, now)) throw new ChatClosedError(orderId);

    const senderRole: $Enums.ChatSenderRole =
      role === "client"
        ? $Enums.ChatSenderRole.client
        : $Enums.ChatSenderRole.pro;
    const message = await this.chatRepository.createMessage({
      orderId,
      senderUserId: actor.id,
      senderRole,
      type: $Enums.ChatMessageType.user,
      text: text.trim(),
      attachmentsJson: attachmentsJson ?? null,
    });

    const textPreview =
      text.length > TEXT_PREVIEW_MAX_LEN
        ? text.slice(0, TEXT_PREVIEW_MAX_LEN) + "..."
        : text;
    const payload = {
      orderId,
      orderDisplayId: order.displayId,
      senderRole: role,
      textPreview,
      messageId: message.id,
    };

    await this.notifyOtherParticipant(order, role, payload).catch((err) => {
      // Log but do not fail send; notifications are best-effort
      if (typeof process !== "undefined" && process.emit) {
        process.emit("warning", err as Error);
      }
    });

    return message;
  }

  /**
   * Notify the other participant of a new chat message.
   * PRO: PUSH (recipientRef = userId) + optionally WHATSAPP.
   * CLIENT: EMAIL + optionally WHATSAPP (policy uses recipientRef; we need email/phone per channel).
   */
  private async notifyOtherParticipant(
    order: OrderEntity,
    senderRole: "client" | "pro",
    payload: {
      orderId: string;
      orderDisplayId: string;
      senderRole: string;
      textPreview: string;
      messageId: string;
    }
  ): Promise<void> {
    const recipientRole =
      senderRole === "client" ? ("PRO" as const) : ("CLIENT" as const);
    const resourceId = order.id;

    if (recipientRole === "PRO" && order.proProfileId) {
      const pro = await this.proRepository.findById(order.proProfileId);
      if (!pro) return;
      const recipientRef = pro.userId;
      const messages = buildNotificationMessages({
        event: "chat.new_message",
        resourceId,
        recipientRef,
        recipientRole: "PRO",
        templateId: CHAT_MESSAGE_TEMPLATE_ID,
        payload,
      });
      for (const msg of messages) {
        await this.notificationService.deliverNow(msg).catch(() => {});
      }
      return;
    }

    if (recipientRole === "CLIENT") {
      const clientProfile = await this.clientProfileRepository.findByUserId(
        order.clientUserId
      );
      if (!clientProfile) return;
      const email = clientProfile.email?.trim();
      const phone = clientProfile.phone?.trim();
      if (email) {
        await this.notificationService
          .deliverNow({
            channel: "EMAIL",
            recipientRef: email,
            templateId: CHAT_MESSAGE_TEMPLATE_ID,
            payload,
            idempotencyKey: `chat.new_message:${resourceId}:${order.clientUserId}:EMAIL`,
          })
          .catch(() => {});
      }
      if (phone) {
        await this.notificationService
          .deliverNow({
            channel: "WHATSAPP",
            recipientRef: phone,
            templateId: CHAT_MESSAGE_TEMPLATE_ID,
            payload,
            idempotencyKey: `chat.new_message:${resourceId}:${order.clientUserId}:WHATSAPP`,
          })
          .catch(() => {});
      }
    }
  }

  /**
   * Mark the thread as read up to now for the current user.
   */
  async markRead(actor: Actor, orderId: string): Promise<void> {
    await this.assertParticipant(actor, orderId);
    await this.chatRepository.upsertLastReadAt(orderId, actor.id, new Date());
  }

  /**
   * Get unread message count for the current user in this order.
   */
  async unreadCount(actor: Actor, orderId: string): Promise<number> {
    await this.assertParticipant(actor, orderId);
    return this.chatRepository.countUnreadForUser(orderId, actor.id);
  }

  /**
   * Check if chat is currently open for this order (for UI).
   */
  async isChatOpenForOrder(actor: Actor, orderId: string): Promise<boolean> {
    const { order } = await this.assertParticipant(actor, orderId);
    return isChatOpen(order, new Date());
  }
}

import { injectable } from "tsyringe";
import { prisma, Prisma } from "@infra/db/prisma";
import { $Enums } from "@infra/db/prisma";

/**
 * Chat message entity (plain object)
 */
export interface OrderMessageEntity {
  id: string;
  orderId: string;
  senderUserId: string | null;
  senderRole: $Enums.ChatSenderRole;
  type: $Enums.ChatMessageType;
  text: string;
  attachmentsJson: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Order thread state entity (plain object)
 */
export interface OrderThreadStateEntity {
  id: string;
  orderId: string;
  userId: string;
  lastReadAt: Date | null;
  mutedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListMessagesByOrderInput {
  orderId: string;
  cursor?: string | null;
  limit: number;
}

export interface ListMessagesByOrderResult {
  items: OrderMessageEntity[];
  nextCursor: string | null;
}

export interface ChatRepository {
  listByOrder(
    input: ListMessagesByOrderInput
  ): Promise<ListMessagesByOrderResult>;
  createMessage(params: {
    orderId: string;
    senderUserId: string | null;
    senderRole: $Enums.ChatSenderRole;
    type: $Enums.ChatMessageType;
    text: string;
    attachmentsJson?: Record<string, unknown> | null;
  }): Promise<OrderMessageEntity>;
  upsertLastReadAt(orderId: string, userId: string, at: Date): Promise<void>;
  countUnreadForUser(orderId: string, userId: string): Promise<number>;
}

@injectable()
export class ChatRepositoryImpl implements ChatRepository {
  async listByOrder(
    input: ListMessagesByOrderInput
  ): Promise<ListMessagesByOrderResult> {
    const { orderId, cursor, limit } = input;
    const take = Math.min(limit, 100);

    const messages = await prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    // Return in chronological order (oldest first) for display
    const ordered = [...items].reverse();

    return {
      items: ordered.map((m) => ({
        id: m.id,
        orderId: m.orderId,
        senderUserId: m.senderUserId,
        senderRole: m.senderRole,
        type: m.type,
        text: m.text,
        attachmentsJson: m.attachmentsJson as Record<string, unknown> | null,
        createdAt: m.createdAt,
      })),
      nextCursor,
    };
  }

  async createMessage(params: {
    orderId: string;
    senderUserId: string | null;
    senderRole: $Enums.ChatSenderRole;
    type: $Enums.ChatMessageType;
    text: string;
    attachmentsJson?: Record<string, unknown> | null;
  }): Promise<OrderMessageEntity> {
    const msg = await prisma.orderMessage.create({
      data: {
        orderId: params.orderId,
        senderUserId: params.senderUserId,
        senderRole: params.senderRole,
        type: params.type,
        text: params.text,
        attachmentsJson: (params.attachmentsJson ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return {
      id: msg.id,
      orderId: msg.orderId,
      senderUserId: msg.senderUserId,
      senderRole: msg.senderRole,
      type: msg.type,
      text: msg.text,
      attachmentsJson: msg.attachmentsJson as Record<string, unknown> | null,
      createdAt: msg.createdAt,
    };
  }

  async upsertLastReadAt(
    orderId: string,
    userId: string,
    at: Date
  ): Promise<void> {
    await prisma.orderThreadState.upsert({
      where: {
        orderId_userId: { orderId, userId },
      },
      create: {
        orderId,
        userId,
        lastReadAt: at,
      },
      update: {
        lastReadAt: at,
      },
    });
  }

  async countUnreadForUser(orderId: string, userId: string): Promise<number> {
    const state = await prisma.orderThreadState.findUnique({
      where: { orderId_userId: { orderId, userId } },
    });
    const lastReadAt = state?.lastReadAt ?? null;

    const count = await prisma.orderMessage.count({
      where: {
        orderId,
        createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
        senderUserId: { not: userId },
      },
    });
    return count;
  }
}

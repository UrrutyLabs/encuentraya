import { injectable } from "tsyringe";
import { $Enums, Prisma } from "@infra/db/prisma";
import { prisma } from "@infra/db/prisma";

/**
 * Order line item entity (plain object)
 * Matches the Prisma OrderLineItem model structure
 */
export interface OrderLineItemEntity {
  id: string;
  orderId: string;
  type: string; // OrderLineItemType enum value
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: string;
  taxBehavior: string | null; // TaxBehavior enum value
  taxRate: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Order line item create input
 */
export interface OrderLineItemCreateInput {
  orderId: string;
  type: string; // OrderLineItemType enum value
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency?: string; // defaults to "UYU"
  taxBehavior?: string | null; // TaxBehavior enum value
  taxRate?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Order line item repository interface
 * Handles all data access for order line items
 */
export interface OrderLineItemRepository {
  create(input: OrderLineItemCreateInput): Promise<OrderLineItemEntity>;
  createMany(
    inputs: OrderLineItemCreateInput[]
  ): Promise<OrderLineItemEntity[]>;
  findByOrderId(orderId: string): Promise<OrderLineItemEntity[]>;
  deleteByOrderId(orderId: string): Promise<void>;
  replaceOrderLineItems(
    orderId: string,
    items: OrderLineItemCreateInput[]
  ): Promise<OrderLineItemEntity[]>;
}

/**
 * Prisma OrderLineItem type inference
 */
type PrismaOrderLineItem =
  | NonNullable<Awaited<ReturnType<typeof prisma.orderLineItem.findUnique>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.orderLineItem.create>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.orderLineItem.update>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.orderLineItem.findMany>>[0]>;

/**
 * Order line item repository implementation using Prisma
 */
@injectable()
export class OrderLineItemRepositoryImpl implements OrderLineItemRepository {
  async create(input: OrderLineItemCreateInput): Promise<OrderLineItemEntity> {
    const lineItem = await prisma.orderLineItem.create({
      data: {
        orderId: input.orderId,
        type: input.type as $Enums.OrderLineItemType,
        description: input.description,
        quantity: input.quantity,
        unitAmount: input.unitAmount,
        amount: input.amount,
        currency: input.currency ?? "UYU",
        taxBehavior: input.taxBehavior
          ? (input.taxBehavior as $Enums.TaxBehavior)
          : null,
        taxRate: input.taxRate ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    return this.mapPrismaToDomain(lineItem);
  }

  async createMany(
    inputs: OrderLineItemCreateInput[]
  ): Promise<OrderLineItemEntity[]> {
    if (inputs.length === 0) {
      return [];
    }

    const created = await prisma.orderLineItem.createManyAndReturn({
      data: inputs.map((input) => ({
        orderId: input.orderId,
        type: input.type as $Enums.OrderLineItemType,
        description: input.description,
        quantity: input.quantity,
        unitAmount: input.unitAmount,
        amount: input.amount,
        currency: input.currency ?? "UYU",
        taxBehavior: input.taxBehavior
          ? (input.taxBehavior as $Enums.TaxBehavior)
          : null,
        taxRate: input.taxRate ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      })),
    });

    return created.map(this.mapPrismaToDomain);
  }

  async findByOrderId(orderId: string): Promise<OrderLineItemEntity[]> {
    const lineItems = await prisma.orderLineItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });

    return lineItems.map(this.mapPrismaToDomain);
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await prisma.orderLineItem.deleteMany({
      where: { orderId },
    });
  }

  async replaceOrderLineItems(
    orderId: string,
    items: OrderLineItemCreateInput[]
  ): Promise<OrderLineItemEntity[]> {
    // Delete existing line items
    await this.deleteByOrderId(orderId);

    // Create new line items
    if (items.length === 0) {
      return [];
    }

    return this.createMany(items.map((item) => ({ ...item, orderId })));
  }

  private mapPrismaToDomain(
    prismaLineItem: NonNullable<PrismaOrderLineItem>
  ): OrderLineItemEntity {
    const p = prismaLineItem;
    return {
      id: p.id,
      orderId: p.orderId,
      type: String(p.type),
      description: p.description,
      quantity: p.quantity,
      unitAmount: p.unitAmount,
      amount: p.amount,
      currency: p.currency,
      taxBehavior: p.taxBehavior ? String(p.taxBehavior) : null,
      taxRate: p.taxRate,
      metadata: p.metadata as Record<string, unknown> | null,
      createdAt: p.createdAt,
    };
  }
}

import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import type { OrderReceipt } from "@repo/domain";

/**
 * Receipt entity (plain object) for persistence.
 * Matches Prisma Receipt model; maps to domain OrderReceipt for view.
 */
export interface ReceiptEntity {
  id: string;
  orderId: string;
  lineItems: Array<{ type: string; description: string; amount: number }>;
  laborAmount: number;
  platformFeeAmount: number;
  platformFeeRate: number;
  taxAmount: number;
  taxRate: number;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
  finalizedAt: Date;
  approvedHours: number | null;
  createdAt: Date;
}

/**
 * Input to create a receipt (one per order at finalization).
 */
export interface ReceiptCreateInput {
  orderId: string;
  lineItems: Array<{ type: string; description: string; amount: number }>;
  laborAmount: number;
  platformFeeAmount: number;
  platformFeeRate: number;
  taxAmount: number;
  taxRate: number;
  subtotalAmount: number;
  totalAmount: number;
  currency: string;
  finalizedAt: Date;
  approvedHours?: number | null;
}

/**
 * Receipt repository: create by orderId, findByOrderId.
 */
export interface ReceiptRepository {
  create(input: ReceiptCreateInput): Promise<ReceiptEntity>;
  findByOrderId(orderId: string): Promise<ReceiptEntity | null>;
}

type PrismaReceipt =
  | NonNullable<Awaited<ReturnType<typeof prisma.receipt.findUnique>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.receipt.create>>>;

function mapPrismaToEntity(p: PrismaReceipt): ReceiptEntity {
  const lineItems = p.lineItems as Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  return {
    id: p.id,
    orderId: p.orderId,
    lineItems,
    laborAmount: p.laborAmount,
    platformFeeAmount: p.platformFeeAmount,
    platformFeeRate: p.platformFeeRate,
    taxAmount: p.taxAmount,
    taxRate: p.taxRate,
    subtotalAmount: p.subtotalAmount,
    totalAmount: p.totalAmount,
    currency: p.currency,
    finalizedAt: p.finalizedAt,
    approvedHours: p.approvedHours,
    createdAt: p.createdAt,
  };
}

/**
 * Maps ReceiptEntity to domain OrderReceipt (for getById view).
 */
export function receiptEntityToOrderReceipt(
  entity: ReceiptEntity
): OrderReceipt {
  return {
    laborAmount: entity.laborAmount,
    platformFeeAmount: entity.platformFeeAmount,
    platformFeeRate: entity.platformFeeRate,
    taxAmount: entity.taxAmount,
    taxRate: entity.taxRate,
    subtotalAmount: entity.subtotalAmount,
    totalAmount: entity.totalAmount,
    currency: entity.currency,
    lineItems: entity.lineItems,
    finalizedAt: entity.finalizedAt,
    approvedHours: entity.approvedHours ?? undefined,
    orderId: entity.orderId,
  };
}

@injectable()
export class ReceiptRepositoryImpl implements ReceiptRepository {
  async create(input: ReceiptCreateInput): Promise<ReceiptEntity> {
    const receipt = await prisma.receipt.create({
      data: {
        orderId: input.orderId,
        lineItems: input.lineItems as unknown as object,
        laborAmount: input.laborAmount,
        platformFeeAmount: input.platformFeeAmount,
        platformFeeRate: input.platformFeeRate,
        taxAmount: input.taxAmount,
        taxRate: input.taxRate,
        subtotalAmount: input.subtotalAmount,
        totalAmount: input.totalAmount,
        currency: input.currency,
        finalizedAt: input.finalizedAt,
        approvedHours: input.approvedHours ?? undefined,
      },
    });
    return mapPrismaToEntity(receipt);
  }

  async findByOrderId(orderId: string): Promise<ReceiptEntity | null> {
    const receipt = await prisma.receipt.findUnique({
      where: { orderId },
    });
    return receipt ? mapPrismaToEntity(receipt) : null;
  }
}

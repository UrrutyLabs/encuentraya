import { injectable } from "tsyringe";
import { $Enums, Prisma } from "@infra/db/prisma";
import { prisma } from "@infra/db/prisma";
import { OrderStatus } from "@repo/domain";
import { getNextOrderDisplayId } from "./order.display-id";

/**
 * Order entity (plain object)
 * Matches the Prisma Order model structure
 */
export interface OrderEntity {
  id: string;
  displayId: string;
  clientUserId: string;
  proProfileId: string | null;
  categoryId: string; // FK to Category table (required)
  categoryMetadataJson: Record<string, unknown> | null; // Snapshot of category metadata at creation
  subcategoryId: string | null;

  // Job details
  title: string | null;
  description: string | null;
  addressText: string;
  addressLat: number | null;
  addressLng: number | null;
  scheduledWindowStartAt: Date;
  scheduledWindowEndAt: Date | null;

  // Lifecycle
  status: OrderStatus;
  acceptedAt: Date | null;
  confirmedAt: Date | null;
  startedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
  canceledAt: Date | null;
  cancelReason: string | null;

  // Pricing snapshots
  pricingMode: string; // PricingMode enum value
  hourlyRateSnapshotAmount: number;
  currency: string;
  minHoursSnapshot: number | null;

  // Quote (fixed-price flow)
  quotedAmountCents: number | null;
  quotedAt: Date | null;
  quoteMessage: string | null;
  quoteAcceptedAt: Date | null;

  // Hours (null for fixed orders)
  estimatedHours: number | null;
  finalHoursSubmitted: number | null;
  approvedHours: number | null;
  approvalMethod: string | null; // ApprovalMethod enum value
  approvalDeadlineAt: Date | null;

  // Totals (cached)
  subtotalAmount: number | null;
  platformFeeAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  totalsCalculatedAt: Date | null;

  // Tax snapshot
  taxScheme: string | null;
  taxRate: number | null;
  taxIncluded: boolean;
  taxRegion: string | null;
  taxCalculatedAt: Date | null;

  // Dispute fields
  disputeStatus: string; // DisputeStatus enum value
  disputeReason: string | null;
  disputeOpenedBy: string | null;

  // Metadata
  isFirstOrder: boolean;
  photoUrlsJson?: unknown;
  workProofPhotoUrlsJson?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order create input
 */
export interface OrderCreateInput {
  clientUserId: string;
  proProfileId?: string;
  categoryId: string; // FK to Category table (required)
  subcategoryId?: string;
  categoryMetadataJson?: Record<string, unknown>; // Optional snapshot of category metadata
  title?: string;
  description?: string;
  addressText: string;
  addressLat?: number;
  addressLng?: number;
  scheduledWindowStartAt: Date;
  scheduledWindowEndAt?: Date;
  estimatedHours?: number | null; // Optional/null for fixed
  pricingMode?: string; // PricingMode enum value, defaults to "hourly"
  quotedAmountCents?: number | null;
  quotedAt?: Date | null;
  quoteMessage?: string | null;
  quoteAcceptedAt?: Date | null;
  hourlyRateSnapshotAmount: number;
  currency?: string; // defaults to "UYU"
  minHoursSnapshot?: number;
  isFirstOrder?: boolean;
  photoUrls?: string[]; // Order photos from wizard (storage URLs)
}

/**
 * Order update input
 */
export interface OrderUpdateInput {
  title?: string | null;
  description?: string | null;
  addressText?: string;
  addressLat?: number | null;
  addressLng?: number | null;
  scheduledWindowStartAt?: Date;
  scheduledWindowEndAt?: Date | null;
  estimatedHours?: number | null;
  finalHoursSubmitted?: number | null;
  approvedHours?: number | null;
  approvalMethod?: string | null;
  approvalDeadlineAt?: Date | null;
  arrivedAt?: Date | null;
  completedAt?: Date | null;
  cancelReason?: string | null;
  disputeReason?: string | null;
  disputeOpenedBy?: string | null;
  quotedAmountCents?: number | null;
  quotedAt?: Date | null;
  quoteMessage?: string | null;
  quoteAcceptedAt?: Date | null;
  subtotalAmount?: number | null;
  platformFeeAmount?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  totalsCalculatedAt?: Date | null;
  taxScheme?: string | null;
  taxRate?: number | null;
  taxIncluded?: boolean;
  taxRegion?: string | null;
  taxCalculatedAt?: Date | null;
  workProofPhotoUrlsJson?: unknown; // Array of storage URLs as JSON
}

/**
 * Filters for admin list orders
 */
export interface AdminListOrdersFilters {
  status?: OrderStatus;
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  cursor?: string;
}

/**
 * Order repository interface
 * Handles all data access for orders
 */
export interface OrderRepository {
  create(input: OrderCreateInput): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByDisplayId(displayId: string): Promise<OrderEntity | null>;
  findByClientUserId(clientUserId: string): Promise<OrderEntity[]>;
  findByProProfileId(proProfileId: string): Promise<OrderEntity[]>;
  findActiveByClientUserId(clientUserId: string): Promise<OrderEntity[]>;
  findManyForAdmin(filters: AdminListOrdersFilters): Promise<OrderEntity[]>;
  countCompletedOrdersByProProfileId(proProfileId: string): Promise<number>;
  update(id: string, data: OrderUpdateInput): Promise<OrderEntity | null>;
  updateStatus(
    id: string,
    status: OrderStatus,
    metadata?: Record<string, unknown>
  ): Promise<OrderEntity | null>;
}

/**
 * Prisma Order type inference
 */
type PrismaOrder =
  | NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.order.create>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.order.update>>>
  | NonNullable<Awaited<ReturnType<typeof prisma.order.findMany>>[0]>;

/**
 * Order repository implementation using Prisma
 */
@injectable()
export class OrderRepositoryImpl implements OrderRepository {
  async create(input: OrderCreateInput): Promise<OrderEntity> {
    // Generate displayId before creating
    const displayId = await getNextOrderDisplayId();

    const order = await prisma.order.create({
      data: {
        displayId,
        clientUserId: input.clientUserId,
        proProfileId: input.proProfileId ?? null,
        categoryId: input.categoryId,
        categoryMetadataJson: input.categoryMetadataJson
          ? (input.categoryMetadataJson as Prisma.InputJsonValue)
          : undefined,
        subcategoryId: input.subcategoryId ?? null,
        title: input.title ?? null,
        description: input.description ?? null,
        addressText: input.addressText,
        addressLat: input.addressLat ?? null,
        addressLng: input.addressLng ?? null,
        scheduledWindowStartAt: input.scheduledWindowStartAt,
        scheduledWindowEndAt: input.scheduledWindowEndAt ?? null,
        pricingMode: (input.pricingMode ?? "hourly") as $Enums.PricingMode,
        hourlyRateSnapshotAmount: input.hourlyRateSnapshotAmount,
        currency: input.currency ?? "UYU",
        minHoursSnapshot: input.minHoursSnapshot ?? null,
        estimatedHours: input.estimatedHours ?? null,
        isFirstOrder: input.isFirstOrder ?? false,
        photoUrlsJson: input.photoUrls
          ? (input.photoUrls as unknown as Prisma.InputJsonValue)
          : undefined,
        status: $Enums.OrderStatus.pending_pro_confirmation,
      },
    });

    return this.mapPrismaToDomain(order);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    return order ? this.mapPrismaToDomain(order) : null;
  }

  async findByDisplayId(displayId: string): Promise<OrderEntity | null> {
    const order = await prisma.order.findUnique({
      where: { displayId },
    });

    return order ? this.mapPrismaToDomain(order) : null;
  }

  async findByClientUserId(clientUserId: string): Promise<OrderEntity[]> {
    const orders = await prisma.order.findMany({
      where: { clientUserId },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(this.mapPrismaToDomain);
  }

  async findByProProfileId(proProfileId: string): Promise<OrderEntity[]> {
    const orders = await prisma.order.findMany({
      where: { proProfileId },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(this.mapPrismaToDomain);
  }

  async findActiveByClientUserId(clientUserId: string): Promise<OrderEntity[]> {
    const orders = await prisma.order.findMany({
      where: {
        clientUserId,
        status: {
          notIn: [
            OrderStatus.COMPLETED,
            OrderStatus.PAID,
            OrderStatus.CANCELED,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(this.mapPrismaToDomain);
  }

  async findManyForAdmin(
    filters: AdminListOrdersFilters
  ): Promise<OrderEntity[]> {
    const { status, query, dateFrom, dateTo, limit = 100, cursor } = filters;

    const where: Prisma.OrderWhereInput = {};

    if (status !== undefined) {
      where.status = status as $Enums.OrderStatus;
    }
    if (dateFrom !== undefined || dateTo !== undefined) {
      where.createdAt = {
        ...(dateFrom !== undefined && { gte: dateFrom }),
        ...(dateTo !== undefined && { lte: dateTo }),
      };
    }
    if (query !== undefined && query.trim() !== "") {
      const q = query.trim();
      where.OR = [
        { displayId: { contains: q, mode: "insensitive" } },
        { id: q },
      ];
    }

    const take = Math.min(Math.max(1, limit), 100);

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const items = orders.slice(0, take);
    return items.map(this.mapPrismaToDomain);
  }

  async countCompletedOrdersByProProfileId(
    proProfileId: string
  ): Promise<number> {
    return prisma.order.count({
      where: {
        proProfileId,
        status: OrderStatus.COMPLETED,
      },
    });
  }

  async update(
    id: string,
    data: OrderUpdateInput
  ): Promise<OrderEntity | null> {
    const updateData: Prisma.OrderUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.addressText !== undefined)
      updateData.addressText = data.addressText;
    if (data.addressLat !== undefined) updateData.addressLat = data.addressLat;
    if (data.addressLng !== undefined) updateData.addressLng = data.addressLng;
    if (data.scheduledWindowStartAt !== undefined)
      updateData.scheduledWindowStartAt = data.scheduledWindowStartAt;
    if (data.scheduledWindowEndAt !== undefined)
      updateData.scheduledWindowEndAt = data.scheduledWindowEndAt;
    if (data.estimatedHours !== undefined)
      updateData.estimatedHours = data.estimatedHours;
    if (data.finalHoursSubmitted !== undefined)
      updateData.finalHoursSubmitted = data.finalHoursSubmitted;
    if (data.approvedHours !== undefined)
      updateData.approvedHours = data.approvedHours;
    if (data.approvalMethod !== undefined)
      updateData.approvalMethod =
        data.approvalMethod as $Enums.ApprovalMethod | null;
    if (data.approvalDeadlineAt !== undefined)
      updateData.approvalDeadlineAt = data.approvalDeadlineAt;
    if (data.arrivedAt !== undefined) updateData.arrivedAt = data.arrivedAt;
    if (data.completedAt !== undefined)
      updateData.completedAt = data.completedAt;
    if (data.quotedAmountCents !== undefined)
      updateData.quotedAmountCents = data.quotedAmountCents;
    if (data.quotedAt !== undefined) updateData.quotedAt = data.quotedAt;
    if (data.quoteMessage !== undefined)
      updateData.quoteMessage = data.quoteMessage;
    if (data.quoteAcceptedAt !== undefined)
      updateData.quoteAcceptedAt = data.quoteAcceptedAt;
    if (data.cancelReason !== undefined)
      updateData.cancelReason = data.cancelReason;
    if (data.disputeReason !== undefined)
      updateData.disputeReason = data.disputeReason;
    if (data.disputeOpenedBy !== undefined)
      updateData.disputeOpenedBy = data.disputeOpenedBy;
    if (data.subtotalAmount !== undefined)
      updateData.subtotalAmount = data.subtotalAmount;
    if (data.platformFeeAmount !== undefined)
      updateData.platformFeeAmount = data.platformFeeAmount;
    if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
    if (data.totalAmount !== undefined)
      updateData.totalAmount = data.totalAmount;
    if (data.totalsCalculatedAt !== undefined)
      updateData.totalsCalculatedAt = data.totalsCalculatedAt;
    if (data.taxScheme !== undefined) updateData.taxScheme = data.taxScheme;
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
    if (data.taxIncluded !== undefined)
      updateData.taxIncluded = data.taxIncluded;
    if (data.taxRegion !== undefined) updateData.taxRegion = data.taxRegion;
    if (data.taxCalculatedAt !== undefined)
      updateData.taxCalculatedAt = data.taxCalculatedAt;
    if (data.workProofPhotoUrlsJson !== undefined)
      updateData.workProofPhotoUrlsJson =
        data.workProofPhotoUrlsJson as Prisma.InputJsonValue;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToDomain(order);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    metadata?: Record<string, unknown>
  ): Promise<OrderEntity | null> {
    const updateData: Prisma.OrderUpdateInput = {
      status: status as $Enums.OrderStatus,
    };

    // Update timestamps based on status
    const now = new Date();
    switch (status) {
      case OrderStatus.ACCEPTED:
        updateData.acceptedAt = now;
        break;
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = now;
        break;
      case OrderStatus.IN_PROGRESS:
        updateData.startedAt = now;
        break;
      case OrderStatus.COMPLETED:
        updateData.completedAt = now;
        break;
      case OrderStatus.PAID:
        updateData.paidAt = now;
        break;
      case OrderStatus.CANCELED:
        updateData.canceledAt = now;
        if (metadata?.cancelReason) {
          updateData.cancelReason = metadata.cancelReason;
        }
        break;
    }

    // Handle dispute status
    if (metadata?.disputeStatus) {
      updateData.disputeStatus = metadata.disputeStatus as $Enums.DisputeStatus;
    }
    if (metadata?.disputeReason) {
      updateData.disputeReason = metadata.disputeReason;
    }
    if (metadata?.disputeOpenedBy) {
      updateData.disputeOpenedBy = metadata.disputeOpenedBy;
    }

    // Handle arrivedAt timestamp (can be set independently of status)
    if (metadata?.arrivedAt) {
      updateData.arrivedAt = metadata.arrivedAt;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToDomain(order);
  }

  private mapPrismaToDomain(
    prismaOrder: NonNullable<PrismaOrder>
  ): OrderEntity {
    const p = prismaOrder;

    return {
      id: p.id,
      displayId: p.displayId,
      clientUserId: p.clientUserId,
      proProfileId: p.proProfileId,
      categoryId: p.categoryId,
      categoryMetadataJson: p.categoryMetadataJson as Record<
        string,
        unknown
      > | null,
      subcategoryId: p.subcategoryId,
      title: p.title,
      description: p.description,
      addressText: p.addressText,
      addressLat: p.addressLat,
      addressLng: p.addressLng,
      scheduledWindowStartAt: p.scheduledWindowStartAt,
      scheduledWindowEndAt: p.scheduledWindowEndAt,
      status: p.status as OrderStatus,
      acceptedAt: p.acceptedAt,
      confirmedAt: p.confirmedAt,
      startedAt: p.startedAt,
      arrivedAt: p.arrivedAt,
      completedAt: p.completedAt,
      paidAt: p.paidAt,
      canceledAt: p.canceledAt,
      cancelReason: p.cancelReason,
      pricingMode: String(p.pricingMode),
      hourlyRateSnapshotAmount: p.hourlyRateSnapshotAmount,
      currency: p.currency,
      minHoursSnapshot: p.minHoursSnapshot,
      quotedAmountCents: p.quotedAmountCents ?? null,
      quotedAt: p.quotedAt ?? null,
      quoteMessage: p.quoteMessage ?? null,
      quoteAcceptedAt: p.quoteAcceptedAt ?? null,
      estimatedHours: p.estimatedHours ?? null,
      finalHoursSubmitted: p.finalHoursSubmitted,
      approvedHours: p.approvedHours,
      approvalMethod: p.approvalMethod ? String(p.approvalMethod) : null,
      approvalDeadlineAt: p.approvalDeadlineAt,
      subtotalAmount: p.subtotalAmount,
      platformFeeAmount: p.platformFeeAmount,
      taxAmount: p.taxAmount,
      totalAmount: p.totalAmount,
      totalsCalculatedAt: p.totalsCalculatedAt,
      taxScheme: p.taxScheme,
      taxRate: p.taxRate,
      taxIncluded: p.taxIncluded,
      taxRegion: p.taxRegion,
      taxCalculatedAt: p.taxCalculatedAt,
      disputeStatus: String(p.disputeStatus),
      disputeReason: p.disputeReason,
      disputeOpenedBy: p.disputeOpenedBy,
      isFirstOrder: p.isFirstOrder,
      ...(p.photoUrlsJson !== undefined && { photoUrlsJson: p.photoUrlsJson }),
      ...(p.workProofPhotoUrlsJson !== undefined && {
        workProofPhotoUrlsJson: p.workProofPhotoUrlsJson,
      }),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}

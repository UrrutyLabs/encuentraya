import { injectable, inject } from "tsyringe";
import type { OrderRepository, OrderEntity } from "./order.repo";
import type {
  OrderLineItemRepository,
  OrderLineItemEntity,
} from "./orderLineItem.repo";
import type { Order, OrderCreateInput } from "@repo/domain";
import {
  OrderStatus,
  PricingMode,
  ApprovalMethod,
  DisputeStatus,
} from "@repo/domain";
import { TOKENS } from "@/server/container";
import { OrderNotFoundError } from "./order.errors";

/**
 * Order service
 * Handles order business logic and domain mapping
 */
@injectable()
export class OrderService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.OrderLineItemRepository)
    private readonly orderLineItemRepository: OrderLineItemRepository
  ) {}

  /**
   * Get order or throw error
   * Reusable helper method for services that require order to exist
   */
  async getOrderOrThrow(orderId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  /**
   * Create a new order
   */
  async createOrder(input: OrderCreateInput): Promise<Order> {
    // This method will be called by OrderCreationService
    // which handles the full creation workflow including pro validation
    throw new Error(
      "Use OrderCreationService.createOrderRequest() instead of OrderService.createOrder()"
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    const orderEntity = await this.orderRepository.findById(id);
    if (!orderEntity) {
      return null;
    }

    // Get line items for this order
    const lineItems = await this.orderLineItemRepository.findByOrderId(id);

    return await this.mapToDomain(orderEntity, lineItems);
  }

  /**
   * Get order by display ID
   */
  async getOrderByDisplayId(displayId: string): Promise<Order | null> {
    const orderEntity = await this.orderRepository.findByDisplayId(displayId);
    if (!orderEntity) {
      return null;
    }

    // Get line items for this order
    const lineItems = await this.orderLineItemRepository.findByOrderId(
      orderEntity.id
    );

    return this.mapToDomain(orderEntity, lineItems);
  }

  /**
   * Get orders for a client
   */
  async getOrdersByClient(clientUserId: string): Promise<Order[]> {
    const orderEntities =
      await this.orderRepository.findByClientUserId(clientUserId);

    // Get line items for all orders
    const ordersWithLineItems = await Promise.all(
      orderEntities.map(async (orderEntity) => {
        const lineItems = await this.orderLineItemRepository.findByOrderId(
          orderEntity.id
        );
        return this.mapToDomain(orderEntity, lineItems);
      })
    );

    return ordersWithLineItems;
  }

  /**
   * Get orders for a pro
   */
  async getOrdersByPro(proProfileId: string): Promise<Order[]> {
    const orderEntities =
      await this.orderRepository.findByProProfileId(proProfileId);

    // Get line items for all orders
    const ordersWithLineItems = await Promise.all(
      orderEntities.map(async (orderEntity) => {
        const lineItems = await this.orderLineItemRepository.findByOrderId(
          orderEntity.id
        );
        return this.mapToDomain(orderEntity, lineItems);
      })
    );

    return ordersWithLineItems;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    metadata?: Record<string, any>
  ): Promise<Order | null> {
    const orderEntity = await this.orderRepository.updateStatus(
      id,
      status,
      metadata
    );
    if (!orderEntity) {
      return null;
    }

    // Get line items for this order
    const lineItems = await this.orderLineItemRepository.findByOrderId(
      orderEntity.id
    );

    return this.mapToDomain(orderEntity, lineItems);
  }

  /**
   * Map OrderEntity to Order domain type
   */
  private mapToDomain(
    entity: OrderEntity,
    lineItems: OrderLineItemEntity[]
  ): Order {
    return {
      id: entity.id,
      displayId: entity.displayId,
      clientUserId: entity.clientUserId,
      proProfileId: entity.proProfileId,
      categoryId: entity.categoryId,
      categoryMetadataJson: entity.categoryMetadataJson,
      subcategoryId: entity.subcategoryId,
      title: entity.title,
      description: entity.description,
      addressText: entity.addressText,
      addressLat: entity.addressLat,
      addressLng: entity.addressLng,
      scheduledWindowStartAt: entity.scheduledWindowStartAt,
      scheduledWindowEndAt: entity.scheduledWindowEndAt,
      status: entity.status,
      acceptedAt: entity.acceptedAt,
      confirmedAt: entity.confirmedAt,
      startedAt: entity.startedAt,
      arrivedAt: entity.arrivedAt,
      completedAt: entity.completedAt,
      paidAt: entity.paidAt,
      canceledAt: entity.canceledAt,
      cancelReason: entity.cancelReason,
      pricingMode: entity.pricingMode as PricingMode,
      hourlyRateSnapshotAmount: entity.hourlyRateSnapshotAmount,
      currency: entity.currency,
      minHoursSnapshot: entity.minHoursSnapshot,
      estimatedHours: entity.estimatedHours,
      finalHoursSubmitted: entity.finalHoursSubmitted,
      approvedHours: entity.approvedHours,
      approvalMethod: entity.approvalMethod
        ? (entity.approvalMethod as ApprovalMethod)
        : null,
      approvalDeadlineAt: entity.approvalDeadlineAt,
      subtotalAmount: entity.subtotalAmount,
      platformFeeAmount: entity.platformFeeAmount,
      taxAmount: entity.taxAmount,
      totalAmount: entity.totalAmount,
      totalsCalculatedAt: entity.totalsCalculatedAt,
      taxScheme: entity.taxScheme,
      taxRate: entity.taxRate,
      taxIncluded: entity.taxIncluded,
      taxRegion: entity.taxRegion,
      taxCalculatedAt: entity.taxCalculatedAt,
      disputeStatus: entity.disputeStatus as DisputeStatus,
      disputeReason: entity.disputeReason,
      disputeOpenedBy: entity.disputeOpenedBy,
      isFirstOrder: entity.isFirstOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

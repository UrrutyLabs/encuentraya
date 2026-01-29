import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { Order } from "@repo/domain";
import { OrderStatus } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import { OrderService } from "./order.service";
import type { AuditService } from "@modules/audit/audit.service";
import { AuditEventType } from "@modules/audit/audit.repo";

/**
 * Order admin service
 * Handles admin operations (list, getById, updateStatus)
 */
@injectable()
export class OrderAdminService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService,
    @inject(TOKENS.AuditService)
    private readonly auditService: AuditService
  ) {}

  /**
   * Admin: List all orders with filters
   * Note: Filtering not yet implemented - returns empty array
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async adminListOrders(filters?: {
    status?: OrderStatus;
    query?: string; // Search by displayId or client/pro email
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    cursor?: string;
  }): Promise<
    Array<{
      id: string;
      displayId: string;
      createdAt: Date;
      status: OrderStatus;
      clientUserId: string;
      proProfileId: string | null;
      categoryId: string;
      totalAmount: number | null;
      currency: string;
    }>
  > {
    // Filtering not yet implemented - repository needs admin query methods
    return [];
  }

  /**
   * Admin: Get order by ID
   */
  async adminGetOrderById(orderId: string): Promise<Order> {
    return this.orderService.getOrderOrThrow(orderId);
  }

  /**
   * Admin: Force update order status
   * Logs the action in audit log
   */
  async adminUpdateStatus(
    actor: Actor,
    orderId: string,
    status: OrderStatus,
    reason?: string
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Update status
    const metadata =
      status === OrderStatus.CANCELED && reason
        ? { cancelReason: reason }
        : undefined;

    const updated = await this.orderService.updateOrderStatus(
      orderId,
      status,
      metadata
    );

    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }

    // Log audit event
    // Note: Using ORDER_STATUS_FORCED for order status forced events
    await this.auditService.logEvent({
      eventType: AuditEventType.ORDER_STATUS_FORCED,
      actor,
      resourceType: "order",
      resourceId: orderId,
      action: "force_status",
      metadata: {
        oldStatus: order.status,
        newStatus: status,
        reason,
      },
    });

    return updated;
  }
}

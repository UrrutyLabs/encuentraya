import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { OrderCreateInput, Order } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container";
import type { ClientProfileService } from "@modules/user/clientProfile.service";
import { OrderStatus } from "@repo/domain";
import { OrderService } from "./order.service";

/**
 * Order creation service
 * Handles order creation workflow including pro validation and hourly rate snapshot
 */
@injectable()
export class OrderCreationService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService
  ) {}

  /**
   * Create a new order request
   * Business rules:
   * - Pro must exist and be active
   * - Set initial status to PENDING_PRO_CONFIRMATION
   * - Snapshot hourly rate at creation time
   * - Scheduled window start must be in the future
   */
  async createOrderRequest(
    actor: Actor,
    input: OrderCreateInput
  ): Promise<Order> {
    // Validate scheduled window start is in the future
    const now = new Date();
    if (input.scheduledWindowStartAt <= now) {
      throw new Error("Scheduled window start must be in the future");
    }

    // Ensure client profile exists (lazy creation)
    await this.clientProfileService.ensureClientProfileExists(actor.id);

    // Validate pro exists and get hourly rate
    let hourlyRateSnapshot: number;
    if (input.proProfileId) {
      const pro = await this.proRepository.findById(input.proProfileId);
      if (!pro) {
        throw new Error("Pro not found");
      }

      if (pro.status === "suspended") {
        throw new Error("Pro is suspended");
      }

      hourlyRateSnapshot = pro.hourlyRate;
    } else {
      // If no pro is specified, we need to get it from somewhere
      // For now, throw an error - in the future this might be a search-based flow
      throw new Error("Pro profile ID is required");
    }

    // Check if this is the client's first order
    const existingOrders = await this.orderRepository.findByClientUserId(
      actor.id
    );
    const isFirstOrder = existingOrders.length === 0;

    // Create order via repository
    const orderEntity = await this.orderRepository.create({
      clientUserId: actor.id,
      proProfileId: input.proProfileId,
      category: input.category as string,
      subcategoryId: input.subcategoryId,
      title: input.title,
      description: input.description,
      addressText: input.addressText,
      addressLat: input.addressLat,
      addressLng: input.addressLng,
      scheduledWindowStartAt: input.scheduledWindowStartAt,
      scheduledWindowEndAt: input.scheduledWindowEndAt,
      estimatedHours: input.estimatedHours,
      pricingMode: "hourly",
      hourlyRateSnapshotAmount: hourlyRateSnapshot,
      currency: "UYU",
      minHoursSnapshot: undefined,
      isFirstOrder,
    });

    // Return domain object
    return this.orderService.getOrderById(orderEntity.id) as Promise<Order>;
  }
}

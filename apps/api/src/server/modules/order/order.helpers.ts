import type { ProRepository } from "@modules/pro/pro.repo";
import { OrderStatus, type Order } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import {
  InvalidOrderStateError,
  UnauthorizedOrderActionError,
} from "./order.errors";

/**
 * Validate state transition according to state machine rules from ORDER_FLOW.md:
 * draft → pending_pro_confirmation
 * pending_pro_confirmation → accepted | canceled
 * accepted → confirmed | canceled
 * confirmed → in_progress | canceled
 * in_progress → awaiting_client_approval
 * awaiting_client_approval → completed | disputed
 * completed → paid
 * disputed → completed | canceled
 */
export function validateStateTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): void {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING_PRO_CONFIRMATION],
    [OrderStatus.PENDING_PRO_CONFIRMATION]: [
      OrderStatus.ACCEPTED,
      OrderStatus.CANCELED,
    ],
    [OrderStatus.ACCEPTED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
    [OrderStatus.CONFIRMED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELED],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.AWAITING_CLIENT_APPROVAL],
    [OrderStatus.AWAITING_CLIENT_APPROVAL]: [
      OrderStatus.COMPLETED,
      OrderStatus.DISPUTED,
    ],
    [OrderStatus.COMPLETED]: [OrderStatus.PAID],
    [OrderStatus.DISPUTED]: [OrderStatus.COMPLETED, OrderStatus.CANCELED],
    [OrderStatus.PAID]: [], // Terminal state
    [OrderStatus.CANCELED]: [], // Terminal state
  };

  const allowed = validTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new InvalidOrderStateError(currentStatus, targetStatus);
  }
}

/**
 * Authorize pro action on an order
 * Throws UnauthorizedOrderActionError if not authorized
 */
export async function authorizeProAction(
  actor: Actor,
  order: Order,
  action: string,
  proRepository: ProRepository
): Promise<void> {
  if (actor.role === Role.ADMIN) {
    return; // Admin can perform any action
  }

  if (actor.role !== Role.PRO) {
    throw new UnauthorizedOrderActionError(
      action,
      "Only pros can perform this action"
    );
  }

  // Get pro profile for actor
  const proProfile = await proRepository.findByUserId(actor.id);
  if (!proProfile) {
    throw new UnauthorizedOrderActionError(action, "Pro profile not found");
  }

  if (order.proProfileId !== proProfile.id) {
    throw new UnauthorizedOrderActionError(
      action,
      "Order is not assigned to this pro"
    );
  }
}

/**
 * Authorize client action on an order
 * Throws UnauthorizedOrderActionError if not authorized
 */
export function authorizeClientAction(
  actor: Actor,
  order: Order,
  action: string
): void {
  if (actor.role === Role.ADMIN) {
    return; // Admin can perform any action
  }

  if (actor.role !== Role.CLIENT) {
    throw new UnauthorizedOrderActionError(
      action,
      "Only clients can perform this action"
    );
  }

  if (order.clientUserId !== actor.id) {
    throw new UnauthorizedOrderActionError(
      action,
      "Order does not belong to this client"
    );
  }
}

/**
 * Authorize order cancellation
 * Can be performed by client or pro depending on order ownership
 * Throws UnauthorizedOrderActionError if not authorized
 */
export async function authorizeOrderCancellation(
  actor: Actor,
  order: Order,
  proRepository: ProRepository
): Promise<void> {
  if (actor.role === Role.ADMIN) {
    return; // Admin can perform any action
  }

  // Check if actor is the client
  const isClient = order.clientUserId === actor.id;

  // Check if actor is the pro
  let isPro = false;
  if (!isClient && actor.role === Role.PRO) {
    const proProfile = await proRepository.findByUserId(actor.id);
    if (proProfile && order.proProfileId === proProfile.id) {
      isPro = true;
    }
  }

  if (!isClient && !isPro) {
    throw new UnauthorizedOrderActionError(
      "cancel order",
      "Order does not belong to this user"
    );
  }
}

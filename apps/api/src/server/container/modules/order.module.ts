import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  OrderRepository,
  OrderRepositoryImpl,
} from "@modules/order/order.repo";
import {
  OrderLineItemRepository,
  OrderLineItemRepositoryImpl,
} from "@modules/order/orderLineItem.repo";
import { OrderService } from "@modules/order/order.service";
import { OrderCreationService } from "@modules/order/order.creation.service";
import { OrderEstimationService } from "@modules/order/order.estimation.service";
import { OrderFinalizationService } from "@modules/order/order.finalization.service";
import { OrderLifecycleService } from "@modules/order/order.lifecycle.service";
import { OrderAdminService } from "@modules/order/order.admin.service";

/**
 * Register Order module dependencies
 * Depends on: ProRepository (for hourly rate snapshot), ClientProfileService
 */
export function registerOrderModule(container: DependencyContainer): void {
  // Register repositories
  container.register<OrderRepository>(TOKENS.OrderRepository, {
    useClass: OrderRepositoryImpl,
  });

  container.register<OrderLineItemRepository>(TOKENS.OrderLineItemRepository, {
    useClass: OrderLineItemRepositoryImpl,
  });

  // Register services (auto-resolves dependencies)
  container.register<OrderService>(TOKENS.OrderService, {
    useClass: OrderService,
  });

  container.register<OrderCreationService>(TOKENS.OrderCreationService, {
    useClass: OrderCreationService,
  });

  container.register<OrderEstimationService>(TOKENS.OrderEstimationService, {
    useClass: OrderEstimationService,
  });

  container.register<OrderFinalizationService>(
    TOKENS.OrderFinalizationService,
    {
      useClass: OrderFinalizationService,
    }
  );

  container.register<OrderLifecycleService>(TOKENS.OrderLifecycleService, {
    useClass: OrderLifecycleService,
  });

  container.register<OrderAdminService>(TOKENS.OrderAdminService, {
    useClass: OrderAdminService,
  });
}

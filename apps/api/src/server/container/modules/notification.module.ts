import type { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  NotificationDeliveryRepositoryImpl,
  type NotificationDeliveryRepository,
} from "@/server/modules/notification/notificationDelivery.repo";
import {
  NotificationService,
} from "@/server/modules/notification/notification.service";

/**
 * Register notification module dependencies
 */
export function registerNotificationModule(container: DependencyContainer): void {
  // Register repository
  container.register<NotificationDeliveryRepository>(TOKENS.NotificationDeliveryRepository, {
    useClass: NotificationDeliveryRepositoryImpl,
  });

  // Register service
  container.register(TOKENS.NotificationService, {
    useClass: NotificationService,
  });
}

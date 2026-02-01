import { container as tsyringeContainer, DependencyContainer } from "tsyringe";
import { registerInfrastructureModule } from "./modules/infrastructure.module";
import { registerUserModule } from "./modules/user.module";
import { registerAuthModule } from "./modules/auth.module";
import { registerProModule } from "./modules/pro.module";
import { registerReviewModule } from "./modules/review.module";
import { registerPaymentModule } from "./modules/payment.module";
import { registerNotificationModule } from "./modules/notification.module";
import { registerPushModule } from "./modules/push.module";
import { registerPayoutModule } from "./modules/payout.module";
import { registerAuditModule } from "./modules/audit.module";
import { registerSearchModule } from "./modules/search.module";
import { registerContactModule } from "./modules/contact.module";
import { registerCategoryModule } from "./modules/category.module";
import { registerSubcategoryModule } from "./modules/subcategory.module";
import { registerOrderModule } from "./modules/order.module";
import { registerChatModule } from "./modules/chat.module";

/**
 * Setup and configure the dependency injection container
 * Registers all modules in dependency order:
 * 1. Infrastructure (foundation)
 * 2. User (foundation)
 * 3. Pro, Review (depend on User)
 * 4. Order, Payment (depend on Pro/Review)
 */
export function setupContainer(): DependencyContainer {
  // Register foundation modules first
  registerInfrastructureModule(tsyringeContainer);
  registerUserModule(tsyringeContainer);
  registerAuthModule(tsyringeContainer); // Depends on User module

  // Register modules that depend on foundation
  registerProModule(tsyringeContainer);
  registerReviewModule(tsyringeContainer);
  registerOrderModule(tsyringeContainer); // Depends on ProRepository for hourly rate snapshot
  registerChatModule(tsyringeContainer); // Depends on OrderRepository, ProRepository

  // Register modules that depend on others
  registerNotificationModule(tsyringeContainer);
  registerPayoutModule(tsyringeContainer); // Register before PaymentModule (PaymentServiceFactory needs EarningService)
  registerPaymentModule(tsyringeContainer);
  registerPushModule(tsyringeContainer);
  registerAuditModule(tsyringeContainer); // Register audit module (can be used by any service)
  registerSubcategoryModule(tsyringeContainer); // Register subcategory module (no dependencies) - must be before CategoryModule
  registerCategoryModule(tsyringeContainer); // Register category module (depends on SubcategoryRepository for ConfigService)
  registerSearchModule(tsyringeContainer); // Register search module (depends on ProService)
  registerContactModule(tsyringeContainer); // Register contact module (depends on NotificationService)

  return tsyringeContainer;
}

// Create and export the configured container
export const container = setupContainer();

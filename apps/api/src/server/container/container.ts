import { container as tsyringeContainer, DependencyContainer } from "tsyringe";
import { registerInfrastructureModule } from "./modules/infrastructure.module";
import { registerUserModule } from "./modules/user.module";
import { registerProModule } from "./modules/pro.module";
import { registerReviewModule } from "./modules/review.module";
import { registerBookingModule } from "./modules/booking.module";
import { registerPaymentModule } from "./modules/payment.module";
import { registerNotificationModule } from "./modules/notification.module";
import { registerPushModule } from "./modules/push.module";

/**
 * Setup and configure the dependency injection container
 * Registers all modules in dependency order:
 * 1. Infrastructure (foundation)
 * 2. User (foundation)
 * 3. Pro, Review (depend on User)
 * 4. Booking, Payment (depend on Pro/Review)
 */
export function setupContainer(): DependencyContainer {
  // Register foundation modules first
  registerInfrastructureModule(tsyringeContainer);
  registerUserModule(tsyringeContainer);

  // Register modules that depend on foundation
  registerProModule(tsyringeContainer);
  registerReviewModule(tsyringeContainer);

  // Register modules that depend on others
  registerBookingModule(tsyringeContainer);
  registerPaymentModule(tsyringeContainer);
  registerNotificationModule(tsyringeContainer);
  registerPushModule(tsyringeContainer);

  return tsyringeContainer;
}

// Create and export the configured container
export const container = setupContainer();

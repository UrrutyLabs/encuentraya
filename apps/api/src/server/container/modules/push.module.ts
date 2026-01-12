import type { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  DevicePushTokenRepositoryImpl,
  type DevicePushTokenRepository,
} from "@/server/modules/push/devicePushToken.repo";
import {
  PushTokenService,
} from "@/server/modules/push/pushToken.service";
import {
  PushDeliveryResolver,
} from "@/server/modules/notification/pushResolver";

/**
 * Register push module dependencies
 */
export function registerPushModule(container: DependencyContainer): void {
  // Register repository
  container.register<DevicePushTokenRepository>(TOKENS.DevicePushTokenRepository, {
    useClass: DevicePushTokenRepositoryImpl,
  });

  // Register service
  container.register(TOKENS.PushTokenService, {
    useClass: PushTokenService,
  });

  // Register push delivery resolver (used by notification providers)
  container.register(TOKENS.PushDeliveryResolver, {
    useClass: PushDeliveryResolver,
  });
}

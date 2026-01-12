import type { NotificationProvider } from "./provider";
import { StubEmailProvider } from "./providers/stubEmail.provider";
import { StubWhatsAppProvider } from "./providers/stubWhatsApp.provider";
import { StubPushProvider } from "./providers/stubPush.provider";
import { container, TOKENS } from "@/server/container";
import type { PushDeliveryResolver } from "./pushResolver";

/**
 * Notification provider registry
 * Returns the appropriate provider based on channel
 * 
 * This keeps provider-specific implementations isolated and allows
 * easy addition of new providers without changing service/router code.
 */
export function getNotificationProvider(channel: "EMAIL" | "WHATSAPP" | "PUSH"): NotificationProvider {
  switch (channel) {
    case "EMAIL":
      return new StubEmailProvider();
    case "WHATSAPP":
      return new StubWhatsAppProvider();
    case "PUSH": {
      // PUSH provider needs PushDeliveryResolver to resolve userId to tokens
      const pushResolver = container.resolve<PushDeliveryResolver>(TOKENS.PushDeliveryResolver);
      return new StubPushProvider(pushResolver);
    }
    default:
      throw new Error(`Unsupported notification channel: ${channel}`);
  }
}

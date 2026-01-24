import { PaymentProvider } from "@repo/domain";
import type { PaymentProviderClient } from "./provider";

/**
 * Payment provider registry
 * Returns the appropriate provider client based on PaymentProvider enum
 *
 * This keeps provider-specific implementations isolated and allows
 * easy addition of new providers without changing service/router code.
 */
export async function getPaymentProviderClient(
  provider: PaymentProvider
): Promise<PaymentProviderClient> {
  switch (provider) {
    case PaymentProvider.MERCADO_PAGO: {
      // Lazy import to avoid loading MP SDK if not needed
      const { MercadoPagoClient } =
        await import("./providers/mercadoPago.client");
      return new MercadoPagoClient();
    }
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

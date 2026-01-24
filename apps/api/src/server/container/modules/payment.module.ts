import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  PaymentRepository,
  PaymentRepositoryImpl,
} from "@modules/payment/payment.repo";
import {
  PaymentEventRepository,
  PaymentEventRepositoryImpl,
} from "@modules/payment/paymentEvent.repo";
import { BookingRepository } from "@modules/booking/booking.repo";
import { ProRepository } from "@modules/pro/pro.repo";
import { PaymentService } from "@modules/payment/payment.service";
import { PaymentProvider } from "@repo/domain";
import { getPaymentProviderClient } from "@modules/payment/registry";
import type { EarningService } from "@modules/payout/earning.service";
import type { AuditService } from "@modules/audit/audit.service";

/**
 * PaymentServiceFactory type
 * Creates a PaymentService instance for a specific provider
 */
export type PaymentServiceFactory = (
  provider: PaymentProvider
) => Promise<PaymentService>;

/**
 * Register Payment module dependencies
 * Depends on: BookingRepository (injected via container)
 */
export function registerPaymentModule(container: DependencyContainer): void {
  // Register repositories
  container.register<PaymentRepository>(TOKENS.PaymentRepository, {
    useClass: PaymentRepositoryImpl,
  });

  container.register<PaymentEventRepository>(TOKENS.PaymentEventRepository, {
    useClass: PaymentEventRepositoryImpl,
  });

  // Register PaymentServiceFactory
  // This factory creates PaymentService instances with provider-specific clients
  // Note: PaymentService constructor requires providerClient and provider as first params,
  // then repositories are injected via @inject decorators. Since we're creating instances
  // manually (not via container.resolve), we need to manually resolve repositories.
  // Use useValue since PaymentServiceFactory is a function type, not a class
  const factory: PaymentServiceFactory = async (
    provider: PaymentProvider
  ): Promise<PaymentService> => {
    const providerClient = await getPaymentProviderClient(provider);
    // Resolve repositories and services from container
    const paymentRepo = container.resolve<PaymentRepository>(
      TOKENS.PaymentRepository
    );
    const paymentEventRepo = container.resolve<PaymentEventRepository>(
      TOKENS.PaymentEventRepository
    );
    const bookingRepo = container.resolve<BookingRepository>(
      TOKENS.BookingRepository
    );
    const proRepo = container.resolve<ProRepository>(TOKENS.ProRepository);
    const earningService = container.resolve<EarningService>(
      TOKENS.EarningService
    );
    const auditService = container.resolve<AuditService>(TOKENS.AuditService);
    // Manually construct PaymentService with all dependencies
    // (providerClient and provider as constructor params, repositories injected)
    return new PaymentService(
      providerClient,
      provider,
      paymentRepo,
      paymentEventRepo,
      bookingRepo,
      proRepo,
      earningService,
      auditService
    );
  };

  // Register the factory function as a value
  // Note: TSyringe's type system has issues with function types, so we use a workaround
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (container as any).register(TOKENS.PaymentServiceFactory, {
    useValue: factory,
  });
}

import { DependencyContainer } from "tsyringe";
import { TOKENS } from "../tokens";
import {
  EarningRepository,
  EarningRepositoryImpl,
} from "@modules/payout/earning.repo";
import { EarningService } from "@modules/payout/earning.service";
import {
  PayoutRepository,
  PayoutRepositoryImpl,
} from "@modules/payout/payout.repo";
import {
  PayoutItemRepository,
  PayoutItemRepositoryImpl,
} from "@modules/payout/payoutItem.repo";
import {
  ProPayoutProfileRepository,
  ProPayoutProfileRepositoryImpl,
} from "@modules/payout/proPayoutProfile.repo";
import { PayoutService } from "@modules/payout/payout.service";
import { ProPayoutProfileService } from "@modules/payout/proPayoutProfile.service";

/**
 * Register Payout module dependencies
 */
export function registerPayoutModule(container: DependencyContainer): void {
  // Register repositories
  container.register<EarningRepository>(TOKENS.EarningRepository, {
    useClass: EarningRepositoryImpl,
  });

  container.register<PayoutRepository>(TOKENS.PayoutRepository, {
    useClass: PayoutRepositoryImpl,
  });

  container.register<PayoutItemRepository>(TOKENS.PayoutItemRepository, {
    useClass: PayoutItemRepositoryImpl,
  });

  container.register<ProPayoutProfileRepository>(
    TOKENS.ProPayoutProfileRepository,
    {
      useClass: ProPayoutProfileRepositoryImpl,
    }
  );

  // Register services
  container.register<EarningService>(TOKENS.EarningService, {
    useClass: EarningService,
  });

  container.register<PayoutService>(TOKENS.PayoutService, {
    useClass: PayoutService,
  });

  container.register<ProPayoutProfileService>(TOKENS.ProPayoutProfileService, {
    useClass: ProPayoutProfileService,
  });
}

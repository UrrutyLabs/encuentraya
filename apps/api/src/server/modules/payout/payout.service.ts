import { injectable, inject } from "tsyringe";
import type { EarningRepository } from "./earning.repo";
import type { PayoutRepository } from "./payout.repo";
import type { PayoutItemRepository } from "./payoutItem.repo";
import type { ProPayoutProfileRepository } from "./proPayoutProfile.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { Actor } from "@infra/auth/roles";
import { Role } from "@repo/domain";
import { TOKENS } from "@/server/container/tokens";
import { getPayoutProviderClient, type PayoutProvider } from "./registry";

/**
 * Error thrown when payout operation fails
 */
export class PayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayoutError";
  }
}

/**
 * Pro with payable earnings summary
 */
export interface PayableProSummary {
  proProfileId: string;
  displayName: string;
  totalPayable: number; // minor units
  currency: string;
  earningsCount: number;
  payoutProfileComplete: boolean;
}

/**
 * Payout service
 * Contains business logic for payout operations
 */
@injectable()
export class PayoutService {
  constructor(
    @inject(TOKENS.EarningRepository)
    private readonly earningRepository: EarningRepository,
    @inject(TOKENS.PayoutRepository)
    private readonly payoutRepository: PayoutRepository,
    @inject(TOKENS.PayoutItemRepository)
    private readonly payoutItemRepository: PayoutItemRepository,
    @inject(TOKENS.ProPayoutProfileRepository)
    private readonly proPayoutProfileRepository: ProPayoutProfileRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}

  /**
   * Create a payout for a pro by batching their PAYABLE earnings
   * Rules:
   * - Admin only
   * - Pro must have PAYABLE earnings
   * - ProPayoutProfile must exist and be isComplete=true
   * - Sum earnings netAmount
   * - Create Payout row status=CREATED
   * - Create PayoutItems for each earning
   * - Mark earnings as PAID only AFTER payout is SENT/SETTLED (not now)
   */
  async createPayoutForPro(
    adminActor: Actor,
    input: { proProfileId: string; provider: PayoutProvider }
  ): Promise<{ payoutId: string }> {
    // Authorization: Admin only
    if (adminActor.role !== Role.ADMIN) {
      throw new PayoutError("Only admins can create payouts");
    }

    // Get pro profile
    const pro = await this.proRepository.findById(input.proProfileId);
    if (!pro) {
      throw new PayoutError(`Pro profile not found: ${input.proProfileId}`);
    }

    // Get PAYABLE earnings for this pro
    const now = new Date();
    const payableEarnings = await this.earningRepository.listPayableByPro(
      input.proProfileId,
      now
    );

    if (payableEarnings.length === 0) {
      throw new PayoutError(
        `No payable earnings found for pro ${input.proProfileId}`
      );
    }

    // Get pro payout profile
    const payoutProfile =
      await this.proPayoutProfileRepository.findByProProfileId(
        input.proProfileId
      );

    if (!payoutProfile) {
      throw new PayoutError(
        `Payout profile not found for pro ${input.proProfileId}`
      );
    }

    // Validate payout profile is complete
    if (!payoutProfile.isComplete) {
      throw new PayoutError(
        `Payout profile for pro ${input.proProfileId} is not complete`
      );
    }

    // Sum earnings netAmount
    const totalAmount = payableEarnings.reduce(
      (sum, earning) => sum + earning.netAmount,
      0
    );

    if (totalAmount <= 0) {
      throw new PayoutError(
        `Total payable amount is zero or negative for pro ${input.proProfileId}`
      );
    }

    // Create Payout row status=CREATED
    const payout = await this.payoutRepository.createPayout({
      proProfileId: input.proProfileId,
      provider: input.provider,
      currency: payoutProfile.currency,
      amount: totalAmount,
    });

    // Create PayoutItems for each earning
    await this.payoutItemRepository.createMany(
      payout.id,
      payableEarnings.map((earning) => ({
        earningId: earning.id,
        amount: earning.netAmount,
      }))
    );

    return { payoutId: payout.id };
  }

  /**
   * Send a payout to the provider
   * Rules:
   * - Admin only
   * - Payout status must be CREATED
   * - Load ProPayoutProfile destination
   * - Call provider client createPayout
   * - Update payout status to SENT (store providerReference, sentAt)
   * - Mark linked earnings to PAID
   */
  async sendPayout(
    adminActor: Actor,
    input: { payoutId: string }
  ): Promise<{ payoutId: string; providerReference: string }> {
    // Authorization: Admin only
    if (adminActor.role !== Role.ADMIN) {
      throw new PayoutError("Only admins can send payouts");
    }

    // Get payout
    const payout = await this.payoutRepository.findById(input.payoutId);
    if (!payout) {
      throw new PayoutError(`Payout not found: ${input.payoutId}`);
    }

    // Validate payout status is CREATED
    if (payout.status !== "CREATED") {
      throw new PayoutError(
        `Payout ${input.payoutId} must be CREATED to send. Current status: ${payout.status}`
      );
    }

    // Get pro payout profile for destination
    const payoutProfile =
      await this.proPayoutProfileRepository.findByProProfileId(
        payout.proProfileId
      );

    if (!payoutProfile) {
      throw new PayoutError(
        `Payout profile not found for pro ${payout.proProfileId}`
      );
    }

    // Build destination from payout profile
    const destination = {
      method: "BANK_TRANSFER" as const,
      bankName: payoutProfile.bankName ?? undefined,
      bankAccountNumber: payoutProfile.bankAccountNumber ?? undefined,
      fullName: payoutProfile.fullName ?? undefined,
      documentId: payoutProfile.documentId ?? undefined,
    };

    // Get provider client
    const providerClient = getPayoutProviderClient(payout.provider);

    // Call provider client createPayout
    const result = await providerClient.createPayout({
      money: {
        amount: payout.amount,
        currency: payout.currency,
      },
      destination,
      reference: payout.id,
    });

    // Update payout status to SENT (store providerReference, sentAt)
    const updatedPayout = await this.payoutRepository.updateStatus(
      payout.id,
      "SENT",
      {
        providerReference: result.providerReference,
        sentAt: new Date(),
      }
    );

    // Get payout items to mark earnings as PAID
    // Note: We need to get the payout items. Since we don't have a findByPayoutId method,
    // we'll need to add it or query earnings directly. For now, let's query earnings by status
    // Actually, we can't query earnings by payoutId directly. We need to add a method to get payout items.
    // But wait, we can get the earnings from the payout items. Let me check if we need to add a method.
    // Actually, the requirement says to mark linked earnings as PAID. The earnings are linked via PayoutItem.
    // We need to get the payout items first. Let me add a method to get payout items by payout ID.

    // For now, let's assume we can get the earning IDs from the payout items
    // We'll need to add a method to PayoutItemRepository to get items by payoutId
    // But to avoid blocking, let's mark earnings as PAID based on the payout items
    // Actually, we need to get the payout items. Let me check the repository interface again.

    // Since we don't have findByPayoutId in PayoutItemRepository, we'll need to add it
    // But for now, let's work around it by getting earnings that are linked to this payout
    // Actually, the best approach is to add a method to get payout items by payout ID
    // But to keep it simple for now, we can query the database directly in the service
    // However, that violates the "no Prisma outside repos" rule

    // Let me add a method to PayoutItemRepository to get items by payoutId
    // Actually, let me check if we can work around this differently

    // For MVP, let's add a simple method to get payout items by payout ID
    // But wait, the requirement says to mark earnings as PAID. We need the earning IDs.
    // The PayoutItem has earningId, so we need to get the payout items first.

    // Let me add a method to get payout items by payout ID in the repository
    // Actually, I'll add it to the interface and implementation

    // For now, let's mark this as a TODO and implement a workaround
    // Actually, let me just add the method to the repository interface

    // Get payout items
    const payoutItems = await this.payoutItemRepository.findByPayoutId(
      payout.id
    );
    const earningIds = payoutItems.map((item) => item.earningId);

    // Mark linked earnings to PAID
    if (earningIds.length > 0) {
      await this.earningRepository.markManyStatus(earningIds, "PAID");
    }

    return {
      payoutId: updatedPayout.id,
      providerReference: result.providerReference,
    };
  }

  /**
   * List pros with payable earnings (for admin UI)
   */
  async listPayablePros(adminActor: Actor): Promise<PayableProSummary[]> {
    // Authorization: Admin only
    if (adminActor.role !== Role.ADMIN) {
      throw new PayoutError("Only admins can list payable pros");
    }

    // Get all pros
    const allPros = await this.proRepository.findAll();

    // For each pro, get their payable earnings
    const now = new Date();
    const summaries: PayableProSummary[] = [];

    for (const pro of allPros) {
      const payableEarnings = await this.earningRepository.listPayableByPro(
        pro.id,
        now
      );

      if (payableEarnings.length > 0) {
        const totalPayable = payableEarnings.reduce(
          (sum, earning) => sum + earning.netAmount,
          0
        );

        // Get currency from first earning (all should have same currency)
        const currency = payableEarnings[0]?.currency || "UYU";

        // Check payout profile completeness
        const payoutProfile =
          await this.proPayoutProfileRepository.findByProProfileId(pro.id);
        const payoutProfileComplete = payoutProfile?.isComplete ?? false;

        summaries.push({
          proProfileId: pro.id,
          displayName: pro.displayName,
          totalPayable,
          currency,
          earningsCount: payableEarnings.length,
          payoutProfileComplete,
        });
      }
    }

    return summaries;
  }

  /**
   * List all payouts (for admin UI)
   */
  async listPayouts(
    adminActor: Actor,
    limit?: number
  ): Promise<
    Array<{
      id: string;
      proProfileId: string;
      provider: string;
      status: string;
      currency: string;
      amount: number;
      providerReference: string | null;
      createdAt: Date;
      sentAt: Date | null;
    }>
  > {
    // Authorization: Admin only
    if (adminActor.role !== Role.ADMIN) {
      throw new PayoutError("Only admins can list payouts");
    }

    const payouts = await this.payoutRepository.listAll(limit);

    return payouts.map((payout) => ({
      id: payout.id,
      proProfileId: payout.proProfileId,
      provider: payout.provider,
      status: payout.status,
      currency: payout.currency,
      amount: payout.amount,
      providerReference: payout.providerReference,
      createdAt: payout.createdAt,
      sentAt: payout.sentAt,
    }));
  }

  /**
   * Get payout by ID
   */
  async getPayout(
    adminActor: Actor,
    payoutId: string
  ): Promise<{
    id: string;
    proProfileId: string;
    provider: string;
    status: string;
    currency: string;
    amount: number;
    providerReference: string | null;
    createdAt: Date;
    sentAt: Date | null;
    earnings: Array<{
      earningId: string;
      bookingId: string;
      netAmount: number;
    }>;
  }> {
    // Authorization: Admin only
    if (adminActor.role !== Role.ADMIN) {
      throw new PayoutError("Only admins can get payout details");
    }

    const payout = await this.payoutRepository.findById(payoutId);
    if (!payout) {
      throw new PayoutError(`Payout not found: ${payoutId}`);
    }

    // Get payout items
    const payoutItems =
      await this.payoutItemRepository.findByPayoutId(payoutId);

    // Get earnings for each item
    const earnings = await Promise.all(
      payoutItems.map(async (item) => {
        const earning = await this.earningRepository.findById(item.earningId);
        if (!earning) {
          throw new PayoutError(`Earning not found: ${item.earningId}`);
        }
        return {
          earningId: earning.id,
          bookingId: earning.bookingId,
          netAmount: earning.netAmount,
        };
      })
    );

    return {
      id: payout.id,
      proProfileId: payout.proProfileId,
      provider: payout.provider,
      status: payout.status,
      currency: payout.currency,
      amount: payout.amount,
      providerReference: payout.providerReference,
      createdAt: payout.createdAt,
      sentAt: payout.sentAt,
      earnings,
    };
  }
}

import { injectable, inject } from "tsyringe";
import type { ProRepository } from "@modules/pro/pro.repo";
import { TOKENS } from "@/server/container";
import {
  calculatePlatformFee,
  calculateTax,
  calculateTotal,
  roundCurrency,
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_TAX_RATE,
} from "./order.calculations";
import type { OrderEstimateInput, OrderEstimateOutput } from "@repo/domain";

/**
 * Service for estimating order costs before creation
 */
@injectable()
export class OrderEstimationService {
  constructor(
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}

  /**
   * Estimate order cost based on pro profile and estimated hours
   * Returns breakdown of labor, platform fee, tax, and totals
   */
  async estimateOrderCost(
    input: OrderEstimateInput
  ): Promise<OrderEstimateOutput> {
    // Fetch pro profile to get hourly rate
    const proProfile = await this.proRepository.findById(input.proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${input.proProfileId}`);
    }

    const hourlyRate = proProfile.hourlyRate;
    const estimatedHours = input.estimatedHours;
    const currency = "UYU"; // Default currency

    // 1. Calculate labor amount
    const laborAmount = roundCurrency(estimatedHours * hourlyRate);

    // 2. Calculate platform fee
    const platformFeeAmount = roundCurrency(
      calculatePlatformFee(laborAmount, DEFAULT_PLATFORM_FEE_RATE)
    );

    // 3. Calculate taxable base (labor + platform fee)
    const taxableBase = roundCurrency(laborAmount + platformFeeAmount);

    // 4. Calculate tax (IVA)
    const taxAmount = roundCurrency(
      calculateTax(taxableBase, DEFAULT_TAX_RATE)
    );

    // 5. Calculate subtotal (labor + platform fee)
    const subtotalAmount = roundCurrency(laborAmount + platformFeeAmount);

    // 6. Calculate total (subtotal + tax)
    const totalAmount = roundCurrency(
      calculateTotal(subtotalAmount, taxAmount)
    );

    // 7. Build line items for display
    const lineItems = [
      {
        type: "labor",
        description: `Labor (${estimatedHours} horas × ${hourlyRate.toFixed(0)} ${currency}/hora)`,
        amount: laborAmount,
      },
      {
        type: "platform_fee",
        description: `Tarifa de plataforma (${(DEFAULT_PLATFORM_FEE_RATE * 100).toFixed(0)}%)`,
        amount: platformFeeAmount,
      },
      {
        type: "tax",
        description: `IVA (${(DEFAULT_TAX_RATE * 100).toFixed(0)}%)`,
        amount: taxAmount,
      },
    ];

    return {
      laborAmount,
      platformFeeAmount,
      platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
      taxAmount,
      taxRate: DEFAULT_TAX_RATE,
      subtotalAmount,
      totalAmount,
      currency,
      lineItems,
    };
  }
}

import { injectable, inject } from "tsyringe";
import type { ProRepository } from "@modules/pro/pro.repo";
import { TOKENS } from "@/server/container";
import {
  calculatePlatformFee,
  calculateTax,
  calculateTotal,
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_TAX_RATE,
} from "./order.calculations";
import { toMinorUnits, toMajorUnits, roundMinorUnits } from "@repo/domain";
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
   *
   * IMPORTANT: All returned amounts are in MINOR UNITS (cents)
   * Frontend should convert to major units for display using toMajorUnits()
   */
  async estimateOrderCost(
    input: OrderEstimateInput
  ): Promise<OrderEstimateOutput> {
    // Fetch pro profile to get hourly rate
    const proProfile = await this.proRepository.findById(input.proProfileId);
    if (!proProfile) {
      throw new Error(`Pro profile not found: ${input.proProfileId}`);
    }

    // hourlyRate is already in minor units (storage format)
    const hourlyRateMinor = proProfile.hourlyRate;
    const hourlyRateMajor = toMajorUnits(hourlyRateMinor); // Convert to major for display in description
    const estimatedHours = input.estimatedHours;
    const currency = "UYU"; // Default currency

    // All calculations performed in minor units
    // 1. Calculate labor amount (in minor units)
    const laborAmount = roundMinorUnits(estimatedHours * hourlyRateMinor);

    // 2. Calculate platform fee (in minor units)
    const platformFeeAmount = calculatePlatformFee(
      laborAmount,
      DEFAULT_PLATFORM_FEE_RATE
    );

    // 3. Calculate taxable base (labor + platform fee) in minor units
    const taxableBase = laborAmount + platformFeeAmount;

    // 4. Calculate tax (IVA) in minor units
    const taxAmount = calculateTax(taxableBase, DEFAULT_TAX_RATE);

    // 5. Calculate subtotal (labor + platform fee) in minor units
    const subtotalAmount = laborAmount + platformFeeAmount;

    // 6. Calculate total (subtotal + tax) in minor units
    const totalAmount = calculateTotal(subtotalAmount, taxAmount);

    // 7. Build line items for display (convert to major units for display only)
    const lineItems = [
      {
        type: "labor",
        description: `Labor (${estimatedHours} horas × ${hourlyRateMajor.toFixed(0)} ${currency}/hora)`,
        amount: laborAmount, // Return in minor units
      },
      {
        type: "platform_fee",
        description: `Tarifa de plataforma (${(DEFAULT_PLATFORM_FEE_RATE * 100).toFixed(0)}%)`,
        amount: platformFeeAmount, // Return in minor units
      },
      {
        type: "tax",
        description: `IVA (${(DEFAULT_TAX_RATE * 100).toFixed(0)}%)`,
        amount: taxAmount, // Return in minor units
      },
    ];

    return {
      laborAmount, // Minor units
      platformFeeAmount, // Minor units
      platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
      taxAmount, // Minor units
      taxRate: DEFAULT_TAX_RATE,
      subtotalAmount, // Minor units
      totalAmount, // Minor units
      currency,
      lineItems, // Amounts in minor units
    };
  }

  /**
   * Build cost breakdown from a quoted amount (fixed-price orders).
   * Used for getById cost breakdown when order has quotedAmountCents.
   */
  estimateFromQuotedAmount(
    quotedAmountCents: number,
    currency: string = "UYU"
  ): OrderEstimateOutput {
    const laborAmount = roundMinorUnits(quotedAmountCents);
    const platformFeeAmount = calculatePlatformFee(
      laborAmount,
      DEFAULT_PLATFORM_FEE_RATE
    );
    const taxableBase = laborAmount + platformFeeAmount;
    const taxAmount = calculateTax(taxableBase, DEFAULT_TAX_RATE);
    const subtotalAmount = laborAmount + platformFeeAmount;
    const totalAmount = calculateTotal(subtotalAmount, taxAmount);
    const lineItems = [
      {
        type: "labor" as const,
        description: "Labor (presupuesto fijo)",
        amount: laborAmount,
      },
      {
        type: "platform_fee" as const,
        description: `Tarifa de plataforma (${(DEFAULT_PLATFORM_FEE_RATE * 100).toFixed(0)}%)`,
        amount: platformFeeAmount,
      },
      {
        type: "tax" as const,
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

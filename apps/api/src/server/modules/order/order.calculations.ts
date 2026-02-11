/**
 * Order calculation utilities
 * Pure functions for calculating order totals and line items
 * IMPORTANT: All amounts are in MINOR UNITS (cents) to prevent float precision issues
 */

import type { OrderLineItemEntity } from "./orderLineItem.repo";
import type { OrderLineItemCreateInput } from "./orderLineItem.repo";
import type { OrderEntity } from "./order.repo";
import { OrderLineItemType, TaxBehavior, roundMinorUnits } from "@repo/domain";

/**
 * Default platform fee rate (10%)
 */
export const DEFAULT_PLATFORM_FEE_RATE = 0.1;

/**
 * Default tax rate (IVA 22% for Uruguay)
 */
export const DEFAULT_TAX_RATE = 0.22;

/**
 * Calculate subtotal from line items
 *
 * Subtotal = sum of all line item amounts (excluding tax line items)
 *
 * @param lineItems - Array of order line items
 * @returns Subtotal amount in minor units (cents)
 */
export function calculateSubtotal(lineItems: OrderLineItemEntity[]): number {
  return lineItems
    .filter((item) => item.type !== OrderLineItemType.TAX)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate platform fee amount in minor units
 * Platform fee = labor amount * platform fee rate
 * @param laborAmount - Labor amount in minor units
 * @param platformFeeRate - Platform fee rate (e.g., 0.1 for 10%)
 * @returns Platform fee in minor units (rounded)
 */
export function calculatePlatformFee(
  laborAmount: number,
  platformFeeRate: number = DEFAULT_PLATFORM_FEE_RATE
): number {
  return roundMinorUnits(laborAmount * platformFeeRate);
}

/**
 * Calculate tax amount from taxable base in minor units
 * Tax = taxable base * tax rate
 * @param taxableBase - Taxable base in minor units
 * @param taxRate - Tax rate (e.g., 0.22 for 22%)
 * @returns Tax amount in minor units (rounded)
 */
export function calculateTax(
  taxableBase: number,
  taxRate: number = DEFAULT_TAX_RATE
): number {
  return roundMinorUnits(taxableBase * taxRate);
}

/**
 * Calculate total amount
 * Total = subtotal + tax amount
 */
export function calculateTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount;
}

/**
 * Calculate taxable base from line items
 * Taxable base = sum of amounts where taxBehavior = taxable
 */
export function calculateTaxableBase(lineItems: OrderLineItemEntity[]): number {
  return lineItems
    .filter((item) => item.taxBehavior === TaxBehavior.TAXABLE)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Build line items for order finalization
 * Creates labor, platform_fee, and tax line items.
 * For hourly: labor = approvedHours * hourlyRate. For fixed: pass laborAmountCents (quoted amount).
 * All amounts are calculated and returned in MINOR UNITS
 *
 * @param order - Order entity (hourlyRateSnapshotAmount in minor units)
 * @param approvedHours - Approved hours (used for hourly; for fixed use 0, labor from laborAmountCents)
 * @param platformFeeRate - Platform fee rate (e.g., 0.1 for 10%)
 * @param taxRate - Tax rate (e.g., 0.22 for 22%)
 * @param laborAmountCents - Optional override: when set (fixed-price), use as labor amount instead of approvedHours * rate
 */
export function buildLineItemsForFinalization(
  order: OrderEntity,
  approvedHours: number,
  platformFeeRate: number = DEFAULT_PLATFORM_FEE_RATE,
  taxRate: number = DEFAULT_TAX_RATE,
  laborAmountCents?: number
): OrderLineItemCreateInput[] {
  const lineItems: OrderLineItemCreateInput[] = [];

  const hourlyRateMinor = order.hourlyRateSnapshotAmount;
  const laborAmount =
    laborAmountCents != null
      ? roundMinorUnits(laborAmountCents)
      : roundMinorUnits(approvedHours * hourlyRateMinor);
  const hourlyRateMajor = hourlyRateMinor / 100;
  const laborDescription =
    laborAmountCents != null
      ? `Labor (presupuesto fijo)`
      : `Labor (${approvedHours} horas × ${hourlyRateMajor.toFixed(0)} ${order.currency}/hora)`;

  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.LABOR,
    description: laborDescription,
    quantity: laborAmountCents != null ? 1 : approvedHours,
    unitAmount: laborAmountCents != null ? laborAmount : hourlyRateMinor,
    amount: laborAmount,
    currency: order.currency,
    taxBehavior: TaxBehavior.TAXABLE,
  });

  // 2. Platform fee line item (all amounts in minor units)
  const platformFeeAmount = calculatePlatformFee(laborAmount, platformFeeRate);
  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.PLATFORM_FEE,
    description: `Tarifa de plataforma (${(platformFeeRate * 100).toFixed(0)}%)`,
    quantity: 1,
    unitAmount: platformFeeAmount, // Store in minor units
    amount: platformFeeAmount, // Store in minor units
    currency: order.currency,
    taxBehavior: TaxBehavior.TAXABLE,
  });

  // 3. Tax (IVA) line item (all amounts in minor units)
  const taxableBase = laborAmount + platformFeeAmount;
  const taxAmount = calculateTax(taxableBase, taxRate);
  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.TAX,
    description: `IVA (${(taxRate * 100).toFixed(0)}%)`,
    quantity: 1,
    unitAmount: taxAmount, // Store in minor units
    amount: taxAmount, // Store in minor units
    currency: order.currency,
    taxBehavior: TaxBehavior.NON_TAXABLE, // Tax itself is not taxable
  });

  return lineItems;
}

/**
 * Round amount to 2 decimal places (for currency in major units)
 *
 * **DEPRECATED**: Use `roundMinorUnits()` from `@repo/domain` instead.
 *
 * @deprecated Use `roundMinorUnits()` from `@repo/domain` instead. All amounts should be in minor units.
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

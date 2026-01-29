/**
 * Order calculation utilities
 * Pure functions for calculating order totals and line items
 */

import type { OrderLineItemEntity } from "./orderLineItem.repo";
import type { OrderLineItemCreateInput } from "./orderLineItem.repo";
import type { OrderEntity } from "./order.repo";
import { OrderLineItemType, TaxBehavior } from "@repo/domain";

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
 * Subtotal = sum of all line item amounts (excluding tax line items)
 */
export function calculateSubtotal(lineItems: OrderLineItemEntity[]): number {
  return lineItems
    .filter((item) => item.type !== OrderLineItemType.TAX)
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate platform fee amount
 * Platform fee = labor amount * platform fee rate
 */
export function calculatePlatformFee(
  laborAmount: number,
  platformFeeRate: number = DEFAULT_PLATFORM_FEE_RATE
): number {
  return laborAmount * platformFeeRate;
}

/**
 * Calculate tax amount from taxable base
 * Tax = taxable base * tax rate
 */
export function calculateTax(
  taxableBase: number,
  taxRate: number = DEFAULT_TAX_RATE
): number {
  return taxableBase * taxRate;
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
 * Creates labor, platform_fee, and tax line items based on approved hours
 */
export function buildLineItemsForFinalization(
  order: OrderEntity,
  approvedHours: number,
  platformFeeRate: number = DEFAULT_PLATFORM_FEE_RATE,
  taxRate: number = DEFAULT_TAX_RATE
): OrderLineItemCreateInput[] {
  const lineItems: OrderLineItemCreateInput[] = [];

  // 1. Labor line item
  const laborAmount = approvedHours * order.hourlyRateSnapshotAmount;
  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.LABOR,
    description: `Labor (${approvedHours} horas × ${order.hourlyRateSnapshotAmount} ${order.currency}/hora)`,
    quantity: approvedHours,
    unitAmount: order.hourlyRateSnapshotAmount,
    amount: laborAmount,
    currency: order.currency,
    taxBehavior: TaxBehavior.TAXABLE,
  });

  // 2. Platform fee line item
  const platformFeeAmount = calculatePlatformFee(laborAmount, platformFeeRate);
  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.PLATFORM_FEE,
    description: `Tarifa de plataforma (${(platformFeeRate * 100).toFixed(0)}%)`,
    quantity: 1,
    unitAmount: platformFeeAmount,
    amount: platformFeeAmount,
    currency: order.currency,
    taxBehavior: TaxBehavior.TAXABLE,
  });

  // 3. Tax (IVA) line item
  const taxableBase = laborAmount + platformFeeAmount;
  const taxAmount = calculateTax(taxableBase, taxRate);
  lineItems.push({
    orderId: order.id,
    type: OrderLineItemType.TAX,
    description: `IVA (${(taxRate * 100).toFixed(0)}%)`,
    quantity: 1,
    unitAmount: taxAmount,
    amount: taxAmount,
    currency: order.currency,
    taxBehavior: TaxBehavior.NON_TAXABLE, // Tax itself is not taxable
  });

  return lineItems;
}

/**
 * Round amount to 2 decimal places (for currency)
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

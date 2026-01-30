/**
 * Currency formatting utilities
 *
 * Universal (works in browser and React Native via Intl API)
 *
 * All amounts should be stored in minor units (cents) and formatted using `isMinorUnits: true`.
 */

/**
 * Format a currency amount for display
 *
 * **Best Practice**: Store amounts in minor units and always pass `isMinorUnits: true`.
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: "UYU")
 * @param isMinorUnits - Whether amount is in minor units (cents). If `true`, divides by 100 before formatting
 * @returns Formatted currency string (e.g., "$402" for UYU)
 *
 * @example
 * ```typescript
 * // Amount in minor units (recommended)
 * formatCurrency(40260, "UYU", true); // Returns "$402"
 *
 * // Amount in major units (legacy, avoid if possible)
 * formatCurrency(402.60, "UYU", false); // Returns "$402"
 * ```
 */
export function formatCurrency(
  amount: number,
  currency: string = "UYU",
  isMinorUnits: boolean = false
): string {
  const amountInMajorUnits = isMinorUnits ? amount / 100 : amount;
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amountInMajorUnits);
}

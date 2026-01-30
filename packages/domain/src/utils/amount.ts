/**
 * Amount unit conversion utilities
 *
 * All monetary amounts should be stored and calculated in MINOR UNITS (cents)
 * to prevent JavaScript float precision issues.
 *
 * @example
 * ```typescript
 * // Major units: 402.60 UYU
 * // Minor units: 40260 cents
 *
 * const amountInCents = toMinorUnits(402.60); // 40260
 * const amountInDollars = toMajorUnits(40260); // 402.60
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number Floating Point Precision Issues}
 */

/**
 * Convert amount from major units (e.g., 402.6 UYU) to minor units (e.g., 40260 cents)
 *
 * @param amount - Amount in major units (e.g., 402.6)
 * @returns Amount in minor units (e.g., 40260), rounded to nearest integer
 *
 * @example
 * ```typescript
 * const cents = toMinorUnits(402.60); // Returns 40260
 * const cents2 = toMinorUnits(100.50); // Returns 10050
 * ```
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert amount from minor units (e.g., 40260 cents) to major units (e.g., 402.6 UYU)
 *
 * @param amount - Amount in minor units (e.g., 40260)
 * @returns Amount in major units (e.g., 402.6)
 *
 * @example
 * ```typescript
 * const dollars = toMajorUnits(40260); // Returns 402.6
 * const dollars2 = toMajorUnits(10050); // Returns 100.5
 * ```
 */
export function toMajorUnits(amount: number): number {
  return amount / 100;
}

/**
 * Round amount in minor units (for calculations)
 *
 * This ensures amounts remain as integers (no float precision issues).
 * Use this when performing calculations that might result in fractional cents.
 *
 * @param amount - Amount in minor units (may be fractional)
 * @returns Rounded amount in minor units (integer)
 *
 * @example
 * ```typescript
 * const rounded = roundMinorUnits(40260.5); // Returns 40261
 * const rounded2 = roundMinorUnits(100.3); // Returns 100
 * ```
 */
export function roundMinorUnits(amount: number): number {
  return Math.round(amount);
}

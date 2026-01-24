/**
 * Payout configuration
 */

/**
 * Platform fee rate (as decimal, e.g., 0.10 for 10%)
 * Default: 10%
 */
export const PLATFORM_FEE_RATE = 0.1;

/**
 * Get cooling-off period in hours from environment variable
 * Default: 48 hours
 */
export function getCoolingOffHours(): number {
  const hours = process.env.PAYOUT_COOLING_OFF_HOURS;
  if (hours) {
    const parsed = parseInt(hours, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 48; // Default 48 hours
}

/**
 * Compute availableAt date (now + cooling-off period)
 */
export function computeAvailableAt(now: Date = new Date()): Date {
  const hours = getCoolingOffHours();
  const availableAt = new Date(now);
  availableAt.setHours(availableAt.getHours() + hours);
  return availableAt;
}

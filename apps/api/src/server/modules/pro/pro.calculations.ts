/**
 * Pro profile calculation utilities
 * Pure functions for calculating ProProfile derived/calculated fields
 */

/**
 * Calculate profileCompleted based on avatarUrl and bio presence
 * Profile is completed when both avatarUrl and bio are present
 */
export function calculateProfileCompleted(
  avatarUrl: string | null | undefined,
  bio: string | null | undefined
): boolean {
  return !!(avatarUrl && bio);
}

/**
 * Calculate isTopPro based on completedJobsCount
 * A pro is considered "top pro" if they have >= 10 completed jobs
 */
export function calculateIsTopPro(completedJobsCount: number): boolean {
  return completedJobsCount >= 10;
}

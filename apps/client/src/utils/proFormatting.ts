/**
 * Utility functions for formatting Pro profile data
 */

/**
 * Format response time in minutes to a human-readable string
 * @param minutes - Response time in minutes, or undefined if not available
 * @returns Formatted string like "Responde en 15 min" or null if not available
 */
export function formatResponseTime(
  minutes: number | undefined | null
): string | null {
  if (!minutes || minutes <= 0) {
    return null;
  }

  if (minutes < 60) {
    return `Responde en ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `Responde en ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  return `Responde en ${hours}h ${remainingMinutes}min`;
}

/**
 * Truncate bio text to a maximum length with ellipsis
 * @param bio - Bio text, or undefined if not available
 * @param maxLength - Maximum length before truncation (default: 120)
 * @returns Truncated bio with ellipsis, or null if bio is empty
 */
export function truncateBio(
  bio: string | undefined | null,
  maxLength: number = 120
): string | null {
  if (!bio || bio.trim().length === 0) {
    return null;
  }

  if (bio.length <= maxLength) {
    return bio;
  }

  // Truncate at the last space before maxLength to avoid cutting words
  const truncated = bio.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    // If we found a space reasonably close to maxLength, use it
    return `${truncated.substring(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}

/**
 * Generate initials from a name for avatar fallback
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return "?";
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Take first letter of first and last name
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format completed jobs count to a human-readable string
 * @param count - Number of completed jobs
 * @returns Formatted string like "15 trabajos completados"
 */
export function formatCompletedJobs(count: number): string {
  if (count === 0) {
    return "Sin trabajos completados";
  }

  if (count === 1) {
    return "1 trabajo completado";
  }

  return `${count} trabajos completados`;
}

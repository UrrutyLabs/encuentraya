import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Date formatting utilities
 */

/**
 * Format a date as "X days ago" in Spanish using date-fns
 * @param date - Date to format
 * @returns Formatted string like "hace 5 días", "hace 2 semanas", etc.
 */
export function formatDaysAgo(date: Date): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: es,
  });
}

/**
 * Get Spanish day name from day of week number
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Spanish day name
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return "";
  }

  return dayNames[dayOfWeek];
}

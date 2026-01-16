/**
 * Format amount from minor units (cents) to major units with currency symbol
 */
export function formatAmount(amount: number, currency: string): string {
  const majorUnits = amount / 100;
  return `${majorUnits.toFixed(0)} ${currency}`;
}

/**
 * Format date to short string (e.g., "15 Ene")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  return `${day} ${month}`;
}

/**
 * Calculate days until a date
 */
export function getDaysUntil(date: Date | string): number {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format date to month and year (e.g., "Enero 2024")
 */
export function formatMonthYear(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${month} ${year}`;
}

/**
 * Get month key for grouping (e.g., "2024-01")
 */
export function getMonthKey(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date | string): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return (
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if date is in last month
 */
export function isLastMonth(date: Date | string): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return (
    dateObj.getMonth() === lastMonth.getMonth() &&
    dateObj.getFullYear() === lastMonth.getFullYear()
  );
}

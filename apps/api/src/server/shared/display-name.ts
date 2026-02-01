/**
 * Masks a full name for display to other parties: "FirstName L."
 * Uses first name + first letter of last name (surname).
 * Single-word names are returned as-is; empty input returns empty string.
 */
export function maskDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  const firstName = parts[0]!;
  const lastPart = parts[parts.length - 1]!;
  const initial = lastPart[0]?.toUpperCase() ?? "";
  return initial ? `${firstName} ${initial}.` : firstName;
}

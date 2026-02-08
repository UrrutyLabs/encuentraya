import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category } from "@repo/domain";

/**
 * Resolve a Lucide icon by name (e.g. "Wrench", "Zap").
 * Returns undefined if the name is not a valid icon component.
 */
function getIconByName(name: string): LucideIcon | undefined {
  const C = (LucideIcons as Record<string, unknown>)[name];
  return typeof C === "object" ? (C as LucideIcon) : undefined;
}

/**
 * Map category.key to icon name (fallback when iconName is missing or unknown).
 */
const CATEGORY_KEY_ICON_NAMES: Record<string, string> = {
  PLUMBING: "Wrench",
  ELECTRICAL: "Zap",
  CLEANING: "Sparkles",
  HANDYMAN: "Hammer",
  PAINTING: "Palette",
  MOVING: "Truck",
};

const DEFAULT_ICON = "Wrench";

/**
 * Get icon for a category object.
 * 1. category.iconName (if set) → dynamic lookup in lucide-react
 * 2. category.key → CATEGORY_KEY_ICON_NAMES then lookup
 * 3. Wrench
 */
export function getCategoryIcon(category: Category): LucideIcon {
  if (category.iconName?.trim()) {
    const byName = getIconByName(category.iconName.trim());
    if (byName) return byName;
  }
  const iconName = CATEGORY_KEY_ICON_NAMES[category.key] ?? DEFAULT_ICON;
  return getIconByName(iconName) ?? (LucideIcons[DEFAULT_ICON] as LucideIcon);
}

/**
 * Get display label for a category object
 * Returns category.name from the API
 */
export function getCategoryLabel(category: Category): string {
  return category.name;
}

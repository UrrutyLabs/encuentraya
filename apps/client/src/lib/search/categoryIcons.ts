import {
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@repo/domain";

/**
 * Map category keys to icons
 * Uses the stable key identifier (e.g., "PLUMBING") to map to icons
 */
const CATEGORY_KEY_ICONS: Record<string, LucideIcon> = {
  PLUMBING: Wrench,
  ELECTRICAL: Zap,
  CLEANING: Sparkles,
  HANDYMAN: Hammer,
  PAINTING: Palette,
};

/**
 * Get icon for a category object
 * Uses category.key to lookup the icon
 */
export function getCategoryIcon(category: Category): LucideIcon {
  return CATEGORY_KEY_ICONS[category.key] ?? Wrench; // Default to Wrench if not found
}

/**
 * Get display label for a category object
 * Returns category.name from the API
 */
export function getCategoryLabel(category: Category): string {
  return category.name;
}

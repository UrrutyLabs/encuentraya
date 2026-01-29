import type { Category } from "@repo/domain";

/**
 * Get the display label for a category
 * Returns the category name (localized in the future)
 */
export function getCategoryLabel(category: Category): string {
  return category.name;
}

/**
 * Get the icon name for a category
 * Returns the iconName from category or a default icon
 */
export function getCategoryIcon(category: Category): string {
  return category.iconName || "Folder";
}

/**
 * Format category metadata JSON for display
 * Converts the metadata object to a readable format
 */
export function formatCategoryMetadata(
  metadataJson: Record<string, unknown> | null
): string {
  if (!metadataJson || Object.keys(metadataJson).length === 0) {
    return "Sin metadatos";
  }

  try {
    return JSON.stringify(metadataJson, null, 2);
  } catch {
    return "Error al formatear metadatos";
  }
}

/**
 * Check if a category is soft-deleted
 */
export function isCategorySoftDeleted(category: Category): boolean {
  return !!category.deletedAt;
}

/**
 * Check if a category is active (not deleted and isActive = true)
 */
export function isCategoryActive(category: Category): boolean {
  return !category.deletedAt && category.isActive;
}

/**
 * Get category status label for display
 */
export function getCategoryStatusLabel(category: Category): string {
  if (category.deletedAt) {
    return "Eliminada";
  }
  if (!category.isActive) {
    return "Inactiva";
  }
  return "Activa";
}

/**
 * Get category status variant for badges
 */
export function getCategoryStatusVariant(
  category: Category
): "success" | "warning" | "danger" {
  if (category.deletedAt) {
    return "danger";
  }
  if (!category.isActive) {
    return "warning";
  }
  return "success";
}

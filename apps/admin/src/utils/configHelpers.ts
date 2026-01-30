/**
 * Merge category and subcategory config JSON
 * Subcategory config overrides category config
 * Returns the effective merged config
 */
export function mergeConfigs(
  categoryConfig: Record<string, unknown> | null,
  subcategoryConfig: Record<string, unknown> | null
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  // Start with category config (base)
  if (categoryConfig) {
    Object.assign(merged, categoryConfig);
  }

  // Override with subcategory config
  if (subcategoryConfig) {
    Object.assign(merged, subcategoryConfig);
  }

  return merged;
}

/**
 * Validate config JSON structure
 * Returns validation errors if any, or null if valid
 *
 * Note: This is a basic validation. For production, consider using a schema validator like Zod
 */
export function validateConfigJson(json: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (json === null || json === undefined) {
    return { isValid: true, errors: [] };
  }

  if (typeof json !== "object") {
    errors.push("El config debe ser un objeto JSON");
    return { isValid: false, errors };
  }

  if (Array.isArray(json)) {
    errors.push("El config no puede ser un array");
    return { isValid: false, errors };
  }

  // Basic structure validation
  const config = json as Record<string, unknown>;

  // Check for common config fields (optional validation)
  // You can extend this with more specific validation rules
  if (config.default_estimated_hours !== undefined) {
    if (typeof config.default_estimated_hours !== "number") {
      errors.push("default_estimated_hours debe ser un número");
    }
  }

  if (config.min_hours !== undefined) {
    if (typeof config.min_hours !== "number" || config.min_hours < 0) {
      errors.push("min_hours debe ser un número positivo");
    }
  }

  if (config.max_hours !== undefined) {
    if (typeof config.max_hours !== "number" || config.max_hours < 0) {
      errors.push("max_hours debe ser un número positivo");
    }
  }

  if (
    config.min_hours !== undefined &&
    config.min_hours !== null &&
    config.max_hours !== undefined &&
    config.max_hours !== null &&
    config.min_hours > config.max_hours
  ) {
    errors.push("min_hours no puede ser mayor que max_hours");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format config JSON for display in UI
 * Converts config object to a readable format
 */
export function formatConfigForDisplay(
  config: Record<string, unknown> | null
): string {
  if (!config || Object.keys(config).length === 0) {
    return "Sin configuración";
  }

  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return "Error al formatear configuración";
  }
}

/**
 * Get a specific config value with type safety
 */
export function getConfigValue<T>(
  config: Record<string, unknown> | null,
  key: string,
  defaultValue: T
): T {
  if (!config || !(key in config)) {
    return defaultValue;
  }

  const value = config[key];
  return value as T;
}

/**
 * Check if config has a specific key
 */
export function hasConfigKey(
  config: Record<string, unknown> | null,
  key: string
): boolean {
  return config !== null && key in config;
}

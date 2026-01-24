/**
 * Environment variable validation utilities
 *
 * Provides type-safe validation for required environment variables
 * with helpful error messages for missing or invalid values.
 */

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type EnvSchema = Record<
  string,
  {
    required?: boolean;
    validate?: (value: string) => boolean | string;
    description?: string;
  }
>;

/**
 * Validates environment variables against a schema
 *
 * @param schema - Object defining required variables and their validation rules
 * @param env - Environment object to validate (defaults to process.env)
 * @returns Validation result with errors array
 *
 * @example
 * ```ts
 * const result = validateEnv({
 *   DATABASE_URL: {
 *     required: true,
 *     validate: (val) => val.startsWith('postgresql://') || 'Must start with postgresql://',
 *     description: 'PostgreSQL connection string'
 *   },
 *   PORT: {
 *     required: false,
 *     validate: (val) => !isNaN(Number(val)) || 'Must be a number'
 *   }
 * });
 *
 * if (!result.isValid) {
 *   console.error('Environment validation failed:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export function validateEnv(
  schema: EnvSchema,
  env: NodeJS.ProcessEnv = process.env
): ValidationResult {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(schema)) {
    const value = env[key];
    const isRequired = config.required !== false; // Default to required

    // Check if required variable is missing
    if (isRequired && (!value || value.trim() === "")) {
      errors.push(
        `Missing required environment variable: ${key}${config.description ? ` (${config.description})` : ""}`
      );
      continue;
    }

    // Skip validation if value is empty and not required
    if (!value || value.trim() === "") {
      continue;
    }

    // Run custom validation if provided
    if (config.validate) {
      const validationResult = config.validate(value);
      if (validationResult !== true) {
        const errorMessage =
          typeof validationResult === "string"
            ? validationResult
            : `Invalid value for ${key}`;
        errors.push(`${key}: ${errorMessage}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation functions
 */
export const validators = {
  /**
   * Validates a PostgreSQL connection string
   */
  postgresUrl: (value: string): boolean | string => {
    if (
      !value.startsWith("postgresql://") &&
      !value.startsWith("postgres://")
    ) {
      return "Must start with 'postgresql://' or 'postgres://'";
    }
    return true;
  },

  /**
   * Validates a URL
   */
  url: (value: string): boolean | string => {
    try {
      new URL(value);
      return true;
    } catch {
      return "Must be a valid URL";
    }
  },

  /**
   * Validates a numeric value
   */
  number: (value: string): boolean | string => {
    if (isNaN(Number(value))) {
      return "Must be a number";
    }
    return true;
  },

  /**
   * Validates a non-empty string
   */
  nonEmpty: (value: string): boolean | string => {
    if (value.trim() === "") {
      return "Cannot be empty";
    }
    return true;
  },

  /**
   * Validates an email address
   */
  email: (value: string): boolean | string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Must be a valid email address";
    }
    return true;
  },
};

/**
 * Helper to throw an error if validation fails
 */
export function requireValidEnv(
  schema: EnvSchema,
  env?: NodeJS.ProcessEnv
): void {
  const result = validateEnv(schema, env);
  if (!result.isValid) {
    console.error("❌ Environment validation failed:\n");
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error(
      "\nPlease check your .env.local file and ensure all required variables are set."
    );
    process.exit(1);
  }
}

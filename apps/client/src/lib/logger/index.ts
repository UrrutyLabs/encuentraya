/**
 * Re-export logger from shared monitoring package
 * This maintains backward compatibility with existing imports
 *
 * Creates a logger instance for the client app
 */

import { createLogger, LogLevel } from "@repo/monitoring/logger";
import type { LogContext, LoggerConfig } from "@repo/monitoring/logger";

const isDevelopment = process.env.NODE_ENV === "development";

// Create logger instance for client app
export const logger = createLogger({
  minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableCrashReporting: !isDevelopment,
});

export { createLogger, LogLevel };
export type { LogContext, LoggerConfig };

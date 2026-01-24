/**
 * Re-export logger from shared monitoring package
 * This maintains backward compatibility with existing imports
 *
 * Creates a logger instance for the mobile app
 */

import { createLogger, LogLevel } from "@repo/monitoring/logger";
import type { LogContext, LoggerConfig } from "@repo/monitoring/logger";

// Create logger instance for mobile app
export const logger = createLogger({
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  enableCrashReporting: !__DEV__,
});

export { createLogger, LogLevel };
export type { LogContext, LoggerConfig };

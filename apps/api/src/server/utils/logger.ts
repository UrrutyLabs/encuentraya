import pino from "pino";

/**
 * Logger utility with environment-aware configuration
 * - Development: Pretty printed, human-readable logs
 * - Production: JSON structured logs for log aggregation
 */
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV || "development",
  },
});

/**
 * Create a child logger with additional context
 * Useful for request-scoped logging with user info, request ID, etc.
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

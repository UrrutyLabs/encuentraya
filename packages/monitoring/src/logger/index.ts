/**
 * Structured logging system
 * Provides log levels, sanitization, and optional crash reporting integration
 * Platform-agnostic implementation
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableCrashReporting?: boolean;
}

export interface CrashReporter {
  (error: Error, context?: LogContext): void;
}

export class Logger {
  private config: LoggerConfig;
  private crashReporter: CrashReporter | null = null;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Set crash reporter function (e.g., Sentry.captureException)
   */
  setCrashReporter(reporter: CrashReporter) {
    this.crashReporter = reporter;
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    const sensitiveKeys = [
      "password",
      "token",
      "access_token",
      "refresh_token",
      "authorization",
      "auth",
      "secret",
      "api_key",
      "apikey",
      "credit_card",
      "ssn",
      "social_security",
    ];

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  /**
   * Format log message with context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const levelName = LogLevel[level];
    const contextStr = context
      ? ` ${JSON.stringify(this.sanitize(context))}`
      : "";
    return `[${levelName}] ${message}${contextStr}`;
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    if (level < this.config.minLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    // Console logging
    if (this.config.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, error);
          break;
      }
    }

    // Crash reporting for errors
    if (
      level === LogLevel.ERROR &&
      error &&
      this.config.enableCrashReporting &&
      this.crashReporter
    ) {
      this.crashReporter(error, context);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

/**
 * Create a logger instance
 * Platform-specific code should call this with appropriate config
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

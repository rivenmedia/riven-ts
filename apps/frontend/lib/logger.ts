import { createConsola } from "consola";

import { publicEnvironment } from "../environment/public-environment.schema";

/**
 * Centralized logger instance for the application.
 * Uses consola for styled, consistent logging across the app.
 *
 * Available log levels:
 *
 * 0: Fatal and Error
 * 1: Warnings
 * 2: Normal logs
 * 3: Informational logs, success, fail, ready, start, ...
 * 4: Debug logs
 * 5: Trace logs
 * -999: Silent
 * +999: Verbose logs
 *
 * Set LOG_LEVEL environment variable to adjust log level.
 */
export const logger = createConsola({
  level: publicEnvironment.NEXT_PUBLIC_LOG_LEVEL,
  formatOptions: {
    date: publicEnvironment.NEXT_PUBLIC_LOG_DATE,
    colors: publicEnvironment.NEXT_PUBLIC_LOG_COLORS,
    compact: publicEnvironment.NEXT_PUBLIC_LOG_COMPACT,
  },
});

/**
 * Create a scoped logger with a specific tag.
 * Useful for categorizing logs by module/feature.
 *
 * @example
 * const authLogger = createScopedLogger('auth');
 * authLogger.info('User logged in');
 */
export function createScopedLogger(tag: string) {
  return logger.withTag(tag);
}

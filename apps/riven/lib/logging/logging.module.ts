import { Global, Inject, Module } from "@nestjs/common";

import { logger } from "../utilities/logger/logger.ts";

/**
 * The Winston logger, including Riven's custom log levels.
 */
export type RivenLogger = typeof logger;

export const RIVEN_LOGGER = Symbol("RIVEN_LOGGER");

/**
 * Injects the shared logger.
 *
 * @returns The parameter decorator
 */
export function InjectLogger() {
  return Inject(RIVEN_LOGGER);
}

/**
 * Exposes the shared logger to the DI container.
 *
 * The logger attaches rotating file transports and creates symlinks when it is
 * constructed, so it must never be instantiated a second time. The existing
 * singleton is surfaced here as a value provider to guarantee a single
 * instance across both DI consumers and direct importers.
 */
@Global()
@Module({
  providers: [{ provide: RIVEN_LOGGER, useValue: logger }],
  exports: [RIVEN_LOGGER],
})
export class LoggingModule {}

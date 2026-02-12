import winston from "winston";

/**
 * A dummy Winston logger for testing purposes.
 * Can be used as a drop-in when testing hooks.
 */
export const mockLogger = winston.createLogger({
  silent: true,
});

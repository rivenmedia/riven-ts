/**
 * Throw this error from a plugin validator to signal that retrying
 * validation will not help (e.g. misconfiguration, wrong settings).
 */
export class FatalValidationError extends Error {}

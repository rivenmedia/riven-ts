/**
 * How many times an expired link may be regenerated before the stream is
 * treated as dead. Bounds the expired -> request-stream-link refresh loop.
 */
export const MAX_HEALTH_CHECK_ATTEMPTS = 2;

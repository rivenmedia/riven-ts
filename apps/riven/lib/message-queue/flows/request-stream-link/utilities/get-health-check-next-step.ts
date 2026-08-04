import type { MediaItemStreamLinkHealthCheckRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";

/**
 * How many times an expired link may be regenerated before the stream is
 * treated as dead. Bounds the expired -> request-stream-link refresh loop.
 */
export const MAX_HEALTH_CHECK_ATTEMPTS = 2;

export function getHealthCheckNextStep(
  state: MediaItemStreamLinkHealthCheckRequestedResponse["state"],
  healthCheckAttempts: number,
) {
  switch (state) {
    case "healthy": {
      return "save-healthy-link";
    }
    case "expired": {
      return healthCheckAttempts >= MAX_HEALTH_CHECK_ATTEMPTS
        ? "blacklist-stream"
        : "request-stream-link";
    }
    case "dead": {
      return "blacklist-stream";
    }
  }
}

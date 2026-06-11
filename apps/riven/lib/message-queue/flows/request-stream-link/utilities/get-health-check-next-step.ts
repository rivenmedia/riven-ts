import type { MediaItemStreamLinkHealthCheckRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-health-check-requested.event";

export function getHealthCheckNextStep(
  state: MediaItemStreamLinkHealthCheckRequestedResponse["state"],
) {
  switch (state) {
    case "healthy":
      return "save-healthy-link";
    case "expired":
      return "request-stream-link";
    case "dead":
      return "blacklist-stream";
  }
}

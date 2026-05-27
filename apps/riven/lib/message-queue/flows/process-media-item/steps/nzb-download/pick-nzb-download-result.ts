import type { MediaItemNzbDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-download-requested.event";

/**
 * Pick the first plugin response with a non-failed status from a set of
 * altmount download results. Returns undefined if all plugins failed or
 * the input is empty.
 *
 * The SDK response schema allows `queued | downloading | completed | failed`.
 * `plugin-altmount` is expected to return immediately after queueing the NZB
 * with the download client, so the typical successful return is `"queued"`
 * or `"downloading"` — not yet `"completed"`. v1 has no preference logic;
 * the first non-failed plugin wins.
 */
export function pickFirstSuccess(
  results: readonly MediaItemNzbDownloadRequestedResponse[],
): MediaItemNzbDownloadRequestedResponse | undefined {
  return results.find((result) => result.status !== "failed");
}

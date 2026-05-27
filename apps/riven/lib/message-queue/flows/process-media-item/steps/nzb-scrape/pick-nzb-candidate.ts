import type { NzbCandidate } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

/**
 * Pick the newest NZB candidate by publishDate (descending).
 * Returns undefined for an empty input.
 *
 * v1 has no quality ranking; the newest candidate wins.
 */
export function pickNewestCandidate(
  candidates: readonly NzbCandidate[],
): NzbCandidate | undefined {
  if (candidates.length === 0) return undefined;

  const sorted = [...candidates].sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
  );

  return sorted[0];
}

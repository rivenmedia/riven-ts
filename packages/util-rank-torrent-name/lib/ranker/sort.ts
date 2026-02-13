import { RESOLUTION_MAP } from "../shared/mappings.ts";

import type { RankedResult } from "../types.ts";

export function sortTorrents(
  torrents: Map<string, RankedResult>,
  bucketLimit = Infinity,
  resolutions = new Set<string>(),
) {
  const rawTorrents = [...torrents.entries()];

  const filteredTorrents =
    resolutions.size > 0
      ? rawTorrents.filter(([_, rank]) => {
          return resolutions.has(
            RESOLUTION_MAP.get(rank.data.resolution) ?? "unknown",
          );
        })
      : rawTorrents;

  const sortedTorrents = filteredTorrents.sort((a, b) => b[1].rank - a[1].rank);

  if (Number.isFinite(bucketLimit)) {
    const results = new Map<string, RankedResult>();
    const buckets: Record<string, number> = {};

    for (const [hash, rank] of sortedTorrents) {
      const bucketKey =
        RESOLUTION_MAP.get(rank.data.resolution.toLowerCase()) ?? "unknown";
      const bucketCount = buckets[bucketKey] ?? 0;

      if (bucketCount < bucketLimit) {
        results.set(hash, rank);

        buckets[bucketKey] = bucketCount + 1;
      }
    }

    return results;
  } else {
    return new Map(sortedTorrents);
  }
}

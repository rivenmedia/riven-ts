import { RESOLUTION_MAP } from "../shared/mappings.ts";

import type { Resolution } from "../schemas.ts";
import type { RankedResult } from "../types.ts";

export function sortTorrents(
  torrents: RankedResult[],
  bucketLimit = Infinity,
  resolutions = new Set<Resolution>(),
) {
  const filteredTorrents =
    resolutions.size > 0
      ? torrents.filter((rank) =>
          resolutions.has(
            RESOLUTION_MAP.get(rank.data.resolution) ?? "unknown",
          ),
        )
      : torrents;

  const sortedTorrents = filteredTorrents.sort((a, b) => b.rank - a.rank);

  if (bucketLimit === Infinity) {
    return sortedTorrents;
  }

  const results: RankedResult[] = [];
  const buckets: Record<string, number> = {};

  for (const rank of sortedTorrents) {
    const bucketKey =
      RESOLUTION_MAP.get(rank.data.resolution.toLowerCase()) ?? "unknown";
    const bucketCount = buckets[bucketKey] ?? 0;

    if (bucketCount < bucketLimit) {
      results.push(rank);

      buckets[bucketKey] = bucketCount + 1;
    }
  }

  return results;
}

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

  const sortedTorrents = filteredTorrents.sort((a, b) => {
    return b[1].rank - a[1].rank;
  });

  return new Map(sortedTorrents.slice(0, bucketLimit));
}

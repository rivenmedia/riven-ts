import {
  type RankedResult,
  Resolution,
  ResolutionRank,
} from "@repo/util-rank-torrent-name";

export const sortByRankAndResolution = (a: RankedResult, b: RankedResult) => {
  const { data: resA = "unknown" } = Resolution.safeParse(a.data.resolution);

  const { data: resB = "unknown" } = Resolution.safeParse(b.data.resolution);

  // Combine rank and resolution into a single score for sorting
  // This will prioritise higher ranks, even if it means a lower resolution,
  // but will still prefer higher resolutions when ranks equal.
  const combinedRankA = a.rank + ResolutionRank[resA];
  const combinedRankB = b.rank + ResolutionRank[resB];

  return combinedRankB - combinedRankA;
};

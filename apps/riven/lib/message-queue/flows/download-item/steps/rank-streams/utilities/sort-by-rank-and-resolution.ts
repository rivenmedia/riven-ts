import {
  type RankedResult,
  Resolution,
  ResolutionRank,
} from "@repo/util-rank-torrent-name";

export const sortByRankAndResolution = (a: RankedResult, b: RankedResult) => {
  if (a.rank !== b.rank) {
    return b.rank - a.rank;
  }

  const { data: resA = "unknown" } = Resolution.safeParse(a.data.resolution);
  const { data: resB = "unknown" } = Resolution.safeParse(b.data.resolution);

  return ResolutionRank[resB] - ResolutionRank[resA];
};

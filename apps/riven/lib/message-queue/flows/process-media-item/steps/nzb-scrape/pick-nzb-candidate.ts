import { parseFilePath } from "@repo/util-rank-torrent-name";

import type { NzbCandidate } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

const byPublishDateDesc = (a: NzbCandidate, b: NzbCandidate) =>
  new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();

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

  return [...candidates].sort(byPublishDateDesc)[0];
}

/**
 * Pick a SEASON PACK candidate for `seasonNumber` from a season-level scrape.
 *
 * A `&season=N` tvsearch returns both season packs and individual episodes; the
 * newest result is usually a single episode, which would strand the rest of the
 * season. So for a season we deliberately select only full-season packs (the
 * parsed release name carries the season but no specific episode) covering the
 * target season.
 *
 * Returns undefined when no pack is available — the caller treats that as a
 * scrape miss and fans the season out to per-episode scrapes (which work) so
 * the season still completes, just less efficiently.
 *
 * Ranking among packs: most specific first (a single-season pack beats a
 * complete-series box set), then newest.
 */
export function pickSeasonPackCandidate(
  candidates: readonly NzbCandidate[],
  seasonNumber: number,
): NzbCandidate | undefined {
  const packs = candidates
    .map((candidate) => ({
      candidate,
      parsed: parseFilePath(candidate.title),
    }))
    .filter(
      ({ parsed }) =>
        parsed.episodes.length === 0 && parsed.seasons.includes(seasonNumber),
    );

  if (packs.length === 0) return undefined;

  packs.sort((a, b) => {
    const specificity = a.parsed.seasons.length - b.parsed.seasons.length;
    if (specificity !== 0) return specificity;
    return byPublishDateDesc(a.candidate, b.candidate);
  });

  return packs[0]?.candidate;
}

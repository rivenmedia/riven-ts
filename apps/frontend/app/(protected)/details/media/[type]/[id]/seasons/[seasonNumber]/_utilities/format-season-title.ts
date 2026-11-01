/**
 * Formats a season's display title, e.g. "Season 1", or "Specials" for season 0.
 */
export function formatSeasonTitle(seasonNumber: number) {
  return seasonNumber === 0 ? "Specials" : `Season ${seasonNumber.toString()}`;
}

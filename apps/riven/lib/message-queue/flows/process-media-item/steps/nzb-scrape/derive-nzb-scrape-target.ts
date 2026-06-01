import {
  Episode,
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

/**
 * The TV-specific identifiers an NZB indexer needs to issue a precise query.
 * All null for movies (which key on imdbid instead, handled by the datasource).
 */
export interface NzbScrapeTarget {
  /**
   * The parent SHOW's TheTVDB id (the series id). Newznab tvsearch keys on
   * tvdbid, NOT imdbid, so this is the identifier the indexer actually uses for
   * TV. Resolved via `getShow()` so a Season/Episode always carries the series
   * id, never its own episode/season-level tvdbId.
   */
  tvdbId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
}

/**
 * Derive the season/episode numbers and the parent show's tvdbId for an item
 * about to be NZB-scraped. Movies return all-null (the datasource uses imdbid).
 */
export async function deriveNzbScrapeTarget(
  item: MediaItem,
): Promise<NzbScrapeTarget> {
  if (item instanceof Episode) {
    return {
      tvdbId: (await item.getShow()).tvdbId,
      seasonNumber: await item.season.loadProperty("number"),
      episodeNumber: item.number,
    };
  }

  if (item instanceof Season) {
    return {
      tvdbId: (await item.getShow()).tvdbId,
      seasonNumber: item.number,
      episodeNumber: null,
    };
  }

  if (item instanceof Show) {
    return { tvdbId: item.tvdbId, seasonNumber: null, episodeNumber: null };
  }

  return { tvdbId: null, seasonNumber: null, episodeNumber: null };
}

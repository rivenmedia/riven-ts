import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "../dto/entities/index.ts";

function formatStremioIdentifier(seasonNumber: number, episodeNumber: number) {
  return `:${seasonNumber.toString()}:${episodeNumber.toString()}` as const;
}

interface StremioScrapeConfig {
  identifier: `:${string}:${string}` | null;
  scrapeType: "series" | "movie";
  imdbId: string;
}

/**
 * Gets the Stremio scrape config for a given media item.
 *
 * @param item The media item to get the Stremio scraper config for
 * @returns The Stremio scrape config
 */
export async function getStremioScrapeConfig(
  item: MediaItem,
): Promise<StremioScrapeConfig> {
  if (!item.imdbId) {
    throw new Error("IMDB ID is required for Stremio scrape config");
  }

  if (item instanceof Show) {
    return {
      identifier: formatStremioIdentifier(1, 1),
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Season) {
    return {
      identifier: formatStremioIdentifier(item.number, 1),
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Episode) {
    const seasonNumber = await item.season.loadProperty("number");

    return {
      identifier: formatStremioIdentifier(seasonNumber, item.number),
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Movie) {
    return {
      identifier: null,
      imdbId: item.imdbId,
      scrapeType: "movie",
    };
  }

  throw new Error("Unsupported media item type for Stremio identifier");
}

import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "../dto/entities/index.ts";

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
export function getStremioScrapeConfig(item: MediaItem): StremioScrapeConfig {
  if (!item.imdbId) {
    throw new Error("IMDB ID is required for Stremio scrape config");
  }

  if (item instanceof Show) {
    return {
      identifier: ":1:1",
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Season) {
    return {
      identifier: `:1:${item.number.toString()}`,
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Episode) {
    return {
      identifier: `:${item.season.getProperty("number").toString()}:${item.number.toString()}`,
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

import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "../dto/entities/index.ts";

export interface StremioScrapeConfig {
  identifier: string | null;
  scrapeType: "series" | "movie";
  imdbId: string;
}

/**
 * Gets the Stremio scrape config for a given media item.
 * Uses episode fallbacks for Show (`:1:1`) and Season (`:season:1`),
 * suitable for addons like Torrentio that require episode-level identifiers.
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
      identifier: `:1:1`,
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Season) {
    return {
      identifier: `:${item.number.toString()}:1`,
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Episode) {
    const seasonNumber = await item.season.loadProperty("number");

    return {
      identifier: `:${seasonNumber.toString()}:${item.number.toString()}`,
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

/**
 * Gets the Stremio scrape config for a given media item using minimal identifiers.
 * Show returns no identifier, Season returns only `:{season}`.
 * Suitable for addons like Comet and Meteor that support show/season-level queries.
 *
 * @param item The media item to get the scraper config for
 * @returns The Stremio scrape config
 */
export async function getMinimalStremioScrapeConfig(
  item: MediaItem,
): Promise<StremioScrapeConfig> {
  if (!item.imdbId) {
    throw new Error("IMDB ID is required for Stremio scrape config");
  }

  if (item instanceof Show) {
    return {
      identifier: null,
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Season) {
    return {
      identifier: `:${item.number.toString()}`,
      imdbId: item.imdbId,
      scrapeType: "series",
    };
  }

  if (item instanceof Episode) {
    const seasonNumber = await item.season.loadProperty("number");

    return {
      identifier: `:${seasonNumber.toString()}:${item.number.toString()}`,
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

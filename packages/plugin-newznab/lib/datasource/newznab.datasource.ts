import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";

import {
  NewznabResponse,
  getAttrValue,
  getItemSizeBytes,
} from "../schemas/newznab-response.schema.ts";

import type { NewznabSettings } from "../newznab-settings.schema.ts";
import type { NzbCandidate } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

/**
 * Extract up to `limit` NZB candidates from a parsed NewznabResponse,
 * applying min/max size filtering and sorting by publishDate descending.
 *
 * Extracted as a pure function so it can be tested without instantiating the
 * full datasource (avoids shadow-testing).
 */
export function filterAndSortCandidates(
  response: NewznabResponse,
  indexerUrl: string,
  minSizeBytes: number,
  maxSizeBytes: number,
  limit = 10,
): NzbCandidate[] {
  const candidates: NzbCandidate[] = [];

  for (const item of response.channel.item) {
    const sizeBytes = getItemSizeBytes(item);

    if (sizeBytes < minSizeBytes || sizeBytes > maxSizeBytes) {
      continue;
    }

    const categoryAttr = getAttrValue(item, "category");
    const category = categoryAttr ?? item.category ?? "";

    // Parse the pubDate. Newznab indexers typically emit RFC 2822 dates like
    // "Tue, 25 Feb 2025 12:34:56 +0000". Date.parse handles this well.
    const publishDateMs = Date.parse(item.pubDate);
    const publishDate = isNaN(publishDateMs)
      ? new Date(0).toISOString()
      : new Date(publishDateMs).toISOString();

    candidates.push({
      url: item.link,
      title: item.title,
      size: sizeBytes,
      category,
      publishDate,
      indexer: indexerUrl,
    });
  }

  // Sort newest-first, take top N
  return candidates
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    )
    .slice(0, limit);
}

export class NewznabAPI extends BaseDataSource<NewznabSettings> {
  override baseURL = this.settings.indexerUrl;
  override serviceName = "Newznab";

  protected override rateLimiterOptions: RateLimiterOptions = {
    max: 60,
    duration: 60 * 1000,
  };

  override async validate(): Promise<boolean> {
    try {
      await this.get(
        `api?t=caps&apikey=${encodeURIComponent(this.settings.apiKey)}&o=json`,
      );
      return true;
    } catch {
      return false;
    }
  }

  async scrape(params: {
    item: {
      id: string;
      title: string;
      imdbId?: string | null | undefined;
      type: "movie" | "show" | "season" | "episode";
      seasonNumber?: number | null | undefined;
      episodeNumber?: number | null | undefined;
    };
  }): Promise<NzbCandidate[]> {
    const { item } = params;
    const {
      apiKey,
      minSizeBytes,
      maxSizeBytes,
      movieCategories,
      tvCategories,
    } = this.settings;

    const isMovie = item.type === "movie";
    const categories = isMovie ? movieCategories : tvCategories;
    const catParam = categories.join(",");

    let path: string;

    if (item.imdbId) {
      // Strip the "tt" prefix — Newznab expects a bare numeric ID
      const numericImdb = item.imdbId.replace(/^tt/, "");

      if (isMovie) {
        path = `api?t=movie&imdbid=${numericImdb}&apikey=${encodeURIComponent(apiKey)}&o=json&extended=1&cat=${catParam}`;
      } else {
        // Forward season/episode so tvsearch returns the correct slice of the
        // series. Without these, Newznab returns the entire series feed and
        // downstream candidate selection becomes a coin flip.
        const seasonParam =
          item.seasonNumber != null
            ? `&season=${item.seasonNumber.toString()}`
            : "";
        const episodeParam =
          item.episodeNumber != null
            ? `&ep=${item.episodeNumber.toString()}`
            : "";
        path = `api?t=tvsearch&imdbid=${numericImdb}&apikey=${encodeURIComponent(apiKey)}&o=json&extended=1&cat=${catParam}${seasonParam}${episodeParam}`;
      }
    } else {
      // No IMDB ID — fall back to title search
      this.logger.warn(
        `[${this.serviceName}] No IMDB ID for "${item.title}", falling back to title search`,
      );
      path = `api?t=search&q=${encodeURIComponent(item.title)}&apikey=${encodeURIComponent(apiKey)}&o=json&extended=1&cat=${catParam}`;
    }

    try {
      const raw = await this.get<unknown>(path);
      const parsed = NewznabResponse.parse(raw);

      const candidates = filterAndSortCandidates(
        parsed,
        this.settings.indexerUrl,
        minSizeBytes,
        maxSizeBytes,
      );

      this.logger.info(
        `[${this.serviceName}] Found ${candidates.length.toString()} candidates for "${item.title}" (IMDB: ${item.imdbId ?? "N/A"})`,
      );

      return candidates;
    } catch (error: unknown) {
      this.logger.error(
        `[${this.serviceName}] Failed to scrape "${item.title}" (IMDB: ${item.imdbId ?? "N/A"})`,
        { err: error },
      );

      return [];
    }
  }
}

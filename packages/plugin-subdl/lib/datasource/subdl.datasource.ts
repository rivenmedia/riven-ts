import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { URL } from "node:url";

import { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import { subtitleSearchResponseSchema } from "../schemas/subtitle-search.response.schema.ts";
import { extractSrtFromZip } from "../utilities/extract-srt-from-zip.ts";

import type { SubdlSettings } from "../subdl-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

export class SubdlAPIError extends Error {}

export interface SubtitleSearchOptions {
  tmdbId?: string | undefined;
  imdbId?: string | undefined;
  type: "movie" | "tv";
  seasonNumber?: number | undefined;
  episodeNumber?: number | undefined;
  languages?: string[] | undefined;
}

export class SubdlAPI extends BaseDataSource<SubdlSettings> {
  override baseURL = "https://api.subdl.com/api/v1/";
  override serviceName = "SubDL";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 5,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    requestOpts.params.set("api_key", this.settings.apiKey);
  }

  override async validate() {
    try {
      const response = await this.get<unknown>("subtitles", {
        params: {
          tmdb_id: "27205",
          type: "movie",
          subs_per_page: "1",
        },
      });

      return Boolean(subtitleSearchResponseSchema.parse(response));
    } catch {
      return false;
    }
  }

  async searchSubtitles(
    options: SubtitleSearchOptions,
  ): Promise<SubtitleResponse[]> {
    const params = new URLSearchParams({
      type: options.type,
      subs_per_page: "30",
    });

    if (options.tmdbId) {
      params.set("tmdb_id", options.tmdbId);
    } else if (options.imdbId) {
      params.set("imdb_id", options.imdbId);
    }

    if (options.seasonNumber !== undefined) {
      params.set("season_number", options.seasonNumber.toString());
    }

    if (options.episodeNumber !== undefined) {
      params.set("episode_number", options.episodeNumber.toString());
    }

    if (options.languages?.length) {
      params.set("languages", options.languages.join(","));
    }

    const response = await this.get<unknown>("subtitles", {
      params,
      cacheOptions: { ttl: 1000 * 60 * 30 },
    });

    const parsed = subtitleSearchResponseSchema.safeParse(response);

    if (!parsed.success) {
      this.logger.error("Failed to parse subtitle search response from SubDL", {
        err: parsed.error,
      });

      throw new SubdlAPIError("Invalid response format from SubDL");
    }

    if (!parsed.data.status) {
      this.logger.error("Subtitle search failed on SubDL", {
        err: parsed.data.error,
      });

      throw new SubdlAPIError(`Subtitle search failed: ${parsed.data.error}`);
    }

    return parsed.data.subtitles ?? [];
  }

  /**
   * Download a subtitle ZIP from SubDL, extract the first `.srt` file, and return its content.
   */
  async downloadSubtitle(subtitleUrl: string): Promise<string | undefined> {
    const url = new URL(
      subtitleUrl,
      subtitleUrl.startsWith("http") ? undefined : `https://dl.subdl.com`,
    );

    const signal = AbortSignal.timeout(1000 * 60);
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new SubdlAPIError(
        `Failed to download subtitle from ${url.toString()}: ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return extractSrtFromZip(buffer);
  }
}

export type SubdlContextSlice = BasePluginContext;

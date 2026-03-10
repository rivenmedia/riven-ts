import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { promisify } from "node:util";
import { inflateRaw } from "node:zlib";
import z from "zod";

import type { SubdlSettings } from "../subdl-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

const inflateRawAsync = promisify(inflateRaw);

export class SubdlAPIError extends Error {}

const subtitleSchema = z.object({
  release_name: z.string(),
  name: z.string(),
  lang: z.string(),
  author: z.string().optional(),
  url: z.string(),
  subtitlePage: z.string().optional(),
});

const searchResponseSchema = z.object({
  status: z.boolean(),
  results: z
    .array(
      z.object({
        sd_id: z.number().optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  subtitles: z.array(subtitleSchema).optional(),
});

export type SubtitleResult = z.infer<typeof subtitleSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

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
      const response = await this.get<SearchResponse>("subtitles", {
        params: {
          tmdb_id: "27205",
          type: "movie",
          subs_per_page: "1",
        },
      });

      return (
        searchResponseSchema.safeParse(response).success && response.status
      );
    } catch {
      return false;
    }
  }

  async searchSubtitles(
    options: SubtitleSearchOptions,
  ): Promise<SubtitleResult[]> {
    const params: Record<string, string> = {
      type: options.type,
      subs_per_page: "30",
    };

    if (options.tmdbId) {
      params["tmdb_id"] = options.tmdbId;
    } else if (options.imdbId) {
      params["imdb_id"] = options.imdbId;
    }

    if (options.seasonNumber !== undefined) {
      params["season_number"] = options.seasonNumber.toString();
    }

    if (options.episodeNumber !== undefined) {
      params["episode_number"] = options.episodeNumber.toString();
    }

    if (options.languages?.length) {
      params["languages"] = options.languages.join(",");
    }

    const response = await this.get<SearchResponse>("subtitles", {
      params,
      cacheOptions: { ttl: 1000 * 60 * 30 },
    });

    const parsed = searchResponseSchema.safeParse(response);
    if (!parsed.success || !parsed.data.status) {
      return [];
    }

    return parsed.data.subtitles ?? [];
  }

  /**
   * Download a subtitle ZIP from SubDL, extract the first .srt file, and return its content.
   */
  async downloadSubtitle(subtitleUrl: string): Promise<string | undefined> {
    const url = subtitleUrl.startsWith("http")
      ? subtitleUrl
      : `https://dl.subdl.com${subtitleUrl}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new SubdlAPIError(
        `Failed to download subtitle from ${url}: ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return extractSrtFromZip(buffer);
  }
}

/**
 * Extract the first .srt file from a ZIP buffer using Node.js built-in zlib.
 *
 * ZIP local file header format:
 * - 4 bytes: signature (0x04034b50)
 * - 2 bytes: version needed
 * - 2 bytes: flags
 * - 2 bytes: compression method (0=stored, 8=deflate)
 * - 4 bytes: mod time/date
 * - 4 bytes: crc32
 * - 4 bytes: compressed size
 * - 4 bytes: uncompressed size
 * - 2 bytes: filename length
 * - 2 bytes: extra field length
 * - N bytes: filename
 * - M bytes: extra field
 * - compressed data
 */
async function extractSrtFromZip(buffer: Buffer): Promise<string | undefined> {
  let offset = 0;

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const filenameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const filenameStart = offset + 30;
    const filename = buffer.toString(
      "utf8",
      filenameStart,
      filenameStart + filenameLength,
    );

    const dataStart = filenameStart + filenameLength + extraFieldLength;
    const compressedData = buffer.subarray(
      dataStart,
      dataStart + compressedSize,
    );

    if (filename.endsWith(".srt")) {
      if (compressionMethod === 0) {
        return compressedData.toString("utf8");
      }
      if (compressionMethod === 8) {
        const decompressed = await inflateRawAsync(compressedData);
        return decompressed.toString("utf8");
      }
    }

    offset = dataStart + compressedSize;
  }

  return undefined;
}

export type SubdlContextSlice = BasePluginContext;

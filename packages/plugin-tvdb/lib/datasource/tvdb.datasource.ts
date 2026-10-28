import { BaseDataSource, DataSourceHTTPError } from "@repo/util-plugin-sdk";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { DateTime } from "luxon";
import z from "zod";

import { episodeBaseRecordSchema } from "../__generated__/zod/episodeBaseRecordSchema.ts";
import { getAllSeries200Schema } from "../__generated__/zod/getAllSeriesSchema.ts";
import { getSeasonTranslation200Schema } from "../__generated__/zod/getSeasonTranslationSchema.ts";
import { getSeriesExtendedQueryResponseSchema } from "../__generated__/zod/getSeriesExtendedSchema.ts";
import { getSeriesTranslation200Schema } from "../__generated__/zod/getSeriesTranslationSchema.ts";
import { postLogin200Schema } from "../__generated__/zod/postLoginSchema.ts";

import type { EpisodeBaseRecordSchema } from "../__generated__/zod/episodeBaseRecordSchema.ts";
import type { SeasonBaseRecordSchema } from "../__generated__/zod/seasonBaseRecordSchema.ts";
import type { TvdbSettings } from "../tvdb-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { RateLimiterOptions } from "@repo/util-plugin-sdk";
import type { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";
import type { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

type OfficialSeasonRecord = SeasonBaseRecordSchema & {
  id: number;
  number: number;
};

class TvdbAPIError extends Error {
  public override name = "TvdbAPIError";
}

interface TvdbToken {
  value: string;
  expiresAt: DateTime;
}

export class TvdbAPI extends BaseDataSource<TvdbSettings> {
  public override baseURL = "https://api4.thetvdb.com/v4/";
  public override serviceName = "Tvdb";

  #token: TvdbToken | null = null;

  #inFlightLoginRequest: Promise<unknown> | null = null;

  protected override rateLimiterOptions: RateLimiterOptions = {
    duration: 1000,
    max: 25,
  };

  protected override async willSendRequest(
    path: string,
    requestOpts: AugmentedRequest,
  ) {
    if (path === "login") {
      return;
    }

    const { value } = await this.#getAuthToken();

    requestOpts.headers["authorization"] = `Bearer ${value}`;
    requestOpts.headers["content-type"] = "application/json";
    requestOpts.headers["accept"] = "application/json";
  }

  /**
   * Retrieve all episodes with translated details for a series in official order
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesSeasonEpisodesTranslated}
   *
   * @param id The TVDB id of the series to retrieve episodes for
   * @param language The language code of the episodes to retrieve (default: "eng")
   */
  public async getAllEpisodesInOfficialOrder(id: string, language = "eng") {
    let nextUrl = `series/${id}/episodes/official/${language}`;

    const responseSchema = getAllSeries200Schema.extend({
      data: z.object({
        episodes: z.array(episodeBaseRecordSchema),
      }),
    });

    const allEpisodes: EpisodeBaseRecordSchema[] = [];

    do {
      const response = await this.get<unknown>(nextUrl);
      const { data, links } = responseSchema.parse(response);

      if (data.episodes.length === 0) {
        throw new TvdbAPIError(
          `Failed to retrieve episodes for series with id ${id}: No episodes in response`,
        );
      }

      allEpisodes.push(...data.episodes);

      nextUrl = links?.next ?? "";
    } while (nextUrl);

    return allEpisodes;
  }

  /**
   * Retrieve all seasons in official order by querying the
   * series and filtering out non-officially ordered seasons.
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesExtended}
   *
   * @param id The TVDB id of the series to retrieve seasons for
   */
  public async getAllSeasonsInOfficialOrder(id: string) {
    const seasonRecords = await this.#getOfficialSeasonRecords(id);

    if (seasonRecords.size === 0) {
      return null;
    }

    return [...seasonRecords.values()].map((record) =>
      this.#toIndexerSeason(id, record),
    );
  }

  /**
   * Retrieve a single season in official order, with its overview and translated episodes.
   *
   * @param id The TVDB id of the series the season belongs to
   * @param seasonNumber The official season number (0 for specials)
   * @param language The language code of the overview and episodes to retrieve (default: "eng")
   */
  public async getSeasonInOfficialOrder(
    id: string,
    seasonNumber: number,
    language = "eng",
  ) {
    const seasonRecords = await this.#getOfficialSeasonRecords(id);
    const seasonRecord = seasonRecords.get(seasonNumber);

    if (!seasonRecord) {
      return null;
    }

    const season = this.#toIndexerSeason(id, seasonRecord);

    const [allEpisodes, overview] = await Promise.all([
      this.getAllEpisodesInOfficialOrder(id, language),
      this.#getSeasonOverview(seasonRecord, language),
    ]);

    season.overview = overview;

    const episodes: IndexerEpisode[] = [];

    for (const episode of allEpisodes) {
      if (
        episode.seasonNumber !== seasonNumber ||
        typeof episode.number !== "number" ||
        typeof episode.id !== "number"
      ) {
        continue;
      }

      const airDate = episode.aired
        ? DateTime.fromISO(episode.aired, { zone: "utc" })
        : null;

      episodes.push({
        id: episode.id.toString(),
        rootId: id,
        number: episode.number,
        seasonNumber,
        title: episode.name ?? `Episode ${episode.number.toString()}`,
        overview: episode.overview ?? null,
        airDate: airDate?.isValid ? airDate.toJSDate() : null,
        runtime: episode.runtime ?? null,
        posterUrl: episode.image
          ? new URL(episode.image, "https://artworks.thetvdb.com").toString()
          : null,
      });
    }

    season.episodes = episodes.toSorted((a, b) => a.number - b.number);

    return season;
  }

  /**
   * Retrieve a TVDB season translation by the season id and language code
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Seasons/getSeasonTranslation}
   *
   * @param id The TVDB id of the season to retrieve the translation for
   * @param language The language code of the translation to retrieve (default: "eng")
   * @returns The translation, or `null` if the season has no translation in that language
   */
  public async getSeasonTranslation(id: string, language = "eng") {
    try {
      const response = await this.get<unknown>(
        `seasons/${id}/translations/${language}`,
      );

      return getSeasonTranslation200Schema.parse(response).data ?? null;
    } catch (error) {
      if (
        error instanceof DataSourceHTTPError &&
        error.response.status === StatusCodes.NOT_FOUND.valueOf()
      ) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Retrieve a TVDB series by its id
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesExtended}
   *
   * @param id The TVDB id of the series to retrieve
   */
  public async getSeries(id: string) {
    const response = await this.get<unknown>(`series/${id}/extended`, {
      params: {
        short: "true",
        meta: "translations",
      },
    });
    const { data } = getSeriesExtendedQueryResponseSchema.parse(response);

    if (!data) {
      throw new TvdbAPIError(
        `Failed to retrieve series with id ${id}: No data in response`,
      );
    }

    return data;
  }

  /**
   * Retrieve a TVDB series translation by the series id and language code
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesTranslation}
   *
   * @param id The TVDB id of the series to retrieve translations for
   * @param language The language code of the translation to retrieve (default: "eng")
   */
  public async getSeriesTranslations(id: string, language = "eng") {
    const response = await this.get<unknown>(
      `series/${id}/translations/${language}`,
    );
    const { data } = getSeriesTranslation200Schema.parse(response);

    if (!data) {
      throw new TvdbAPIError(
        `Failed to retrieve series translations with id ${id}: No data in response`,
      );
    }

    return data;
  }

  /**
   * Retrieve the series' officially ordered seasons, keyed by season number.
   */
  async #getOfficialSeasonRecords(id: string) {
    const series = await this.getSeries(id);
    const sortedSeasons =
      series.seasons?.toSorted((a, b) => (a.number ?? 0) - (b.number ?? 0)) ??
      [];

    const seasonRecords = new Map<number, OfficialSeasonRecord>();

    for (const season of sortedSeasons) {
      if (season.type?.type !== "official") {
        continue;
      }

      if (typeof season.number !== "number") {
        continue;
      }

      if (typeof season.id !== "number") {
        continue;
      }

      seasonRecords.set(season.number, {
        ...season,
        id: season.id,
        number: season.number,
      });
    }

    return seasonRecords;
  }

  #toIndexerSeason(
    seriesId: string,
    season: OfficialSeasonRecord,
  ): IndexerSeason {
    return {
      episodes: [],
      id: season.id.toString(),
      number: season.number,
      rootId: seriesId,
      title: season.name ?? `Season ${season.number.toString()}`,
      posterUrl: season.image ?? null,
    };
  }

  /**
   * Retrieve a season's overview, if it has one in the given language.
   */
  async #getSeasonOverview(season: OfficialSeasonRecord, language: string) {
    // Each entry can be a comma-separated list of language codes, e.g. `["eng,fra"]`
    const overviewLanguages = new Set(
      season.overviewTranslations?.flatMap((languages) => languages.split(",")),
    );

    if (!overviewLanguages.has(language)) {
      return null;
    }

    const translation = await this.getSeasonTranslation(
      season.id.toString(),
      language,
    );

    return translation?.overview ?? null;
  }

  /**
   * Retrieve and cache the TVDB authentication token
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Login/post_login}
   *
   * @returns The {@link TvdbToken} from the `/login` response
   */
  async #getAuthToken() {
    const now = DateTime.utc();

    // Return cached token if valid
    if (this.#token && this.#token.expiresAt > now) {
      return this.#token;
    }

    this.#inFlightLoginRequest ??= this.post<unknown>("login", {
      body: {
        apikey: this.settings.apiKey,
      },
    });

    const response = await this.#inFlightLoginRequest.finally(() => {
      this.#inFlightLoginRequest = null;
    });

    const { data } = postLogin200Schema.parse(response);

    if (!data?.token) {
      throw new TvdbAPIError(
        "Failed to retrieve TVDB API token: No token in response",
      );
    }

    this.#token = {
      value: data.token,
      expiresAt: now.plus({ days: 25 }),
    };

    return this.#token;
  }

  public override async validate() {
    try {
      await this.#getAuthToken();

      return true;
    } catch (error) {
      this.logger.error("TVDB validation error", { err: error });

      return false;
    }
  }
}

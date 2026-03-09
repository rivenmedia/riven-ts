import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { DateTime } from "luxon";
import z from "zod";

import {
  type EpisodeBaseRecordSchema,
  episodeBaseRecordSchema,
  getAllSeries200Schema,
  getSeriesExtendedQueryResponseSchema,
  getSeriesTranslation200Schema,
  postLogin200Schema,
} from "../__generated__/index.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";

export class TvdbAPIError extends Error {}

interface TvdbToken {
  value: string;
  expiresAt: DateTime;
}

export class TvdbAPI extends BaseDataSource<TvdbSettings> {
  override baseURL = "https://api4.thetvdb.com/v4/";
  override serviceName = "Tvdb";

  #token: TvdbToken | null = null;

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
  async getAllEpisodesInOfficialOrder(id: string, language = "eng") {
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

      if (!data.episodes.length) {
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
   * Retrieve a TVDB series by its id
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesExtended}
   *
   * @param id The TVDB id of the series to retrieve
   */
  async getSeries(id: string) {
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
  async getSeriesTranslations(id: string, language = "eng") {
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
   * Retrieve and cache the TVDB authentication token
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Login/post_login}
   *
   * @returns The {@link TvdbToken} from the `/login` response
   */
  async #getAuthToken() {
    const now = DateTime.now();

    // Return cached token if valid
    if (this.#token && this.#token.expiresAt > now) {
      return this.#token;
    }

    const response = await this.post<unknown>("login", {
      body: {
        apikey: this.settings.apiKey,
      },
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

  override async validate() {
    try {
      await this.#getAuthToken();

      return true;
    } catch {
      return false;
    }
  }
}

export type TvdbContextSlice = BasePluginContext;

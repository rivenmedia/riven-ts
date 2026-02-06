import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { DateTime } from "luxon";

import {
  getEpisodeExtendedQueryResponseSchema,
  getSeasonExtendedQueryResponseSchema,
  getSeriesExtendedQueryResponseSchema,
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
   * Retrieve a TVDB series by its id
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Series/getSeriesExtended}
   *
   * @param id The TVDB id of the series to retrieve
   */
  async getSeries(id: string) {
    const response = await this.get<unknown>(`series/${id}/extended`);
    const { data } = getSeriesExtendedQueryResponseSchema.parse(response);

    if (!data) {
      throw new TvdbAPIError(
        `Failed to retrieve series with id ${id}: No data in response`,
      );
    }

    return data;
  }

  /**
   * Retrieve a TVDB season by its id
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Seasons/getSeasonExtended}
   *
   * @param id The TVDB id of the season to retrieve
   */
  async getSeason(id: number) {
    const response = await this.get<unknown>(
      `seasons/${id.toString()}/extended`,
    );
    const { data } = getSeasonExtendedQueryResponseSchema.parse(response);

    if (!data) {
      throw new TvdbAPIError(
        `Failed to retrieve season with id ${id.toString()}: No data in response`,
      );
    }

    return data;
  }

  /**
   * Retrieve a TVDB episode by its id
   *
   * @see {@link https://thetvdb.github.io/v4-api/#/Episodes/getEpisodeExtended}
   *
   * @param id The TVDB id of the episode to retrieve
   */
  async getEpisode(id: string) {
    const response = await this.get<unknown>(`episodes/${id}/extended`);
    const { data } = getEpisodeExtendedQueryResponseSchema.parse(response);

    if (!data) {
      throw new TvdbAPIError(
        `Failed to retrieve episode with id ${id}: No data in response`,
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

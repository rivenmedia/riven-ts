import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { LookupByTvdbIdResponse } from "../schemas/lookup-by-tvdb-id-response.schema.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";

import type { TimezoneName } from "countries-and-timezones";

export class TvMazeAPI extends BaseDataSource<TvdbSettings> {
  override baseURL = "https://api.tvmaze.com";
  override serviceName = "Tvdb - TvMaze";

  protected override rateLimiterOptions: RateLimiterOptions = {
    duration: 10000,
    max: 20,
  };

  /**
   * Gets the timezone of a show based on its TVDB ID by querying the TVMaze API.
   * This is necessary because TVDB does not provide timezone information.
   *
   * @param tvdbId The TVDB ID to retrieve timezone for
   * @returns The IANA-compliant timezone of the show's original network, if present
   */
  async getShowTimezone(tvdbId: string): Promise<TimezoneName | undefined> {
    try {
      const showResponse = await this.get<unknown>("lookup/shows", {
        params: {
          thetvdb: tvdbId,
        },
      });

      const data = LookupByTvdbIdResponse.nullable().parse(showResponse);

      if (data === null) {
        return;
      }

      return data.network?.country.timezone;
    } catch (error) {
      this.logger.warn(
        `Failed to retrieve show timezone from TVMaze for TVDB ID ${tvdbId}`,
        { err: error },
      );

      return;
    }
  }

  override validate() {
    return true;
  }
}

export type TvdbContextSlice = BasePluginContext;

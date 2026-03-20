import {
  BaseDataSource,
  type BasePluginContext,
  type RateLimiterOptions,
} from "@repo/util-plugin-sdk";

import { DateTime } from "luxon";

import { LookupByTvdbIdResponse } from "../schemas/lookup-by-tvdb-id-response.schema.ts";
import { TvMazeEpisode } from "../schemas/tvmaze-episode.schema.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";

export class TvMazeAPIError extends Error {}

export class TvMazeAPI extends BaseDataSource<TvdbSettings> {
  override baseURL = "https://api.tvmaze.com";
  override serviceName = "Tvdb - TvMaze";

  protected override rateLimiterOptions: RateLimiterOptions = {
    duration: 10000,
    max: 20,
  };

  /**
   * Gets the next episode air date for a TVDB item by looking up the corresponding show in TVMaze using the TVDB ID,
   * and then fetching the airstamp of the next episode.
   *
   * This is necessary because TVDB does not provide a way to get the exact time of an episode's airing.
   *
   * @param tvdbId The TVDB series ID
   * @returns The next episode air date for the specified TVDB ID
   */
  async getNextEpisodeAirDate(tvdbId: string): Promise<DateTime | null> {
    if (!tvdbId) {
      throw new TvMazeAPIError("Series does not have a TVDB ID");
    }

    const showResponse = await this.get<unknown>("lookup/shows", {
      params: {
        thetvdb: tvdbId,
      },
    });

    const {
      _links: { nextepisode },
    } = LookupByTvdbIdResponse.parse(showResponse);

    if (!nextepisode?.href) {
      return null;
    }

    const episodeResponse = await this.get<unknown>(nextepisode.href);
    const { airstamp } = TvMazeEpisode.parse(episodeResponse);

    return DateTime.fromISO(airstamp);
  }

  override validate() {
    return true;
  }
}

export type TvdbContextSlice = BasePluginContext;

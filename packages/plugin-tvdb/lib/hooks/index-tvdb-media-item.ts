import { MediaItemIndexRequestedEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { TvMazeAPI } from "../datasource/tvmaze.datasource.ts";
import { transformSeries } from "../transformers/transform-series.ts";

import type z from "zod";

export const indexTVDBMediaItem: z.infer<
  typeof MediaItemIndexRequestedEventHandler
> = async ({ dataSources, event }) => {
  if (event.item.tvdbId) {
    const api = dataSources.get(TvdbAPI);
    const tvMazeApi = dataSources.get(TvMazeAPI);

    const series = await api.getSeries(event.item.tvdbId);
    const episodes = await api.getAllEpisodesInOfficialOrder(event.item.tvdbId);
    const nextEpisodeAirDate = await tvMazeApi.getNextEpisodeAirDate(
      event.item.tvdbId,
    );

    return {
      item: transformSeries(event.item, series, episodes, nextEpisodeAirDate),
    };
  } else if (event.item.imdbId) {
    // TODO: Implement IMDb-only indexing logic
    return null;
  }

  return null;
};

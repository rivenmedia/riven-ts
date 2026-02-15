import { MediaItemIndexRequestedEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { transformSeries } from "../transformers/transform-series.ts";

import type z from "zod";

export const indexTVDBMediaItem: z.infer<
  typeof MediaItemIndexRequestedEventHandler
> = async ({ dataSources, event }) => {
  if (event.item.tvdbId) {
    const api = dataSources.get(TvdbAPI);
    const series = await api.getSeries(event.item.tvdbId);
    const seasons = await Promise.all(
      series.seasons
        ?.filter(
          (season): season is { id: number } =>
            season.type?.type === "official" &&
            season.number !== 0 &&
            season.id !== undefined,
        )
        .map((season) => api.getSeason(season.id)) ?? [],
    );

    return {
      item: transformSeries(event.item, series, seasons),
    };
  } else if (event.item.imdbId) {
    // TODO: Implement IMDb-only indexing logic
    return null;
  }

  return null;
};

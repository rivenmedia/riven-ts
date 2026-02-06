import { MediaItemIndexRequestedEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { transformSeries } from "../transformers/transform-series.ts";

import type z from "zod";

export const indexTVDBMediaItem: z.infer<
  typeof MediaItemIndexRequestedEventHandler
> = MediaItemIndexRequestedEventHandler.implementAsync(
  async ({ dataSources, event }) => {
    if (event.item.tvdbId) {
      const api = dataSources.get(TvdbAPI);
      const series = await api.getSeries(event.item.tvdbId);
      const seasons = await Promise.all(
        series.seasons
          ?.filter(
            (season): season is { id: number } =>
              season.type?.type === "official" && season.id !== undefined,
          )
          .map((season) => api.getSeason(season.id)) ?? [],
      );
      console.log(seasons);
      const transformedSeries = transformSeries(event.item, series);

      // console.log(series);

      return {
        item: transformedSeries,
      };
    } else if (event.item.imdbId) {
      return null;
    }

    return null;
  },
);

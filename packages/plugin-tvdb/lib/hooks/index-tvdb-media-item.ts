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
    const allEpisodes = await api.getAllEpisodesInOfficialOrder(
      event.item.tvdbId,
    );

    const seriesTranslation =
      series.originalLanguage !== "eng"
        ? await api.getSeriesTranslations(event.item.tvdbId)
        : null;

    return {
      item: transformSeries(event.item, series, allEpisodes, seriesTranslation),
    };
  } else if (event.item.imdbId) {
    // TODO: Implement IMDb-only indexing logic
    return null;
  }

  return null;
};

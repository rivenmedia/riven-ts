import { MediaItemIndexRequestedEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";

import type z from "zod";

export const indexRequestedHook: z.infer<
  typeof MediaItemIndexRequestedEventHandler
> = MediaItemIndexRequestedEventHandler.implementAsync(
  async ({ dataSources, event }) => {
    if (!event.item.tvdbId) {
      return null;
    }

    const api = dataSources.get(TvdbAPI);
    const series = await api.getSeries(event.item.tvdbId);

    // console.log(series);

    return {
      item: {} as never,
    };
  },
);

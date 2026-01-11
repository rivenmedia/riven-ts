import { UnrecoverableError } from "@repo/util-plugin-sdk/errors/unrecoverable-error";
import { MediaItemIndexRequestedEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";

import type z from "zod";

export const indexTMDBMediaItemHandler: z.input<
  typeof MediaItemIndexRequestedEventHandler
> = async ({ dataSources, event }) => {
  if (!event.item.tmdbId && !event.item.imdbId) {
    throw new UnrecoverableError(
      "Media item must have either a TMDB ID or an IMDB ID",
    );
  }

  const api = dataSources.get(TmdbAPI);
  const { imdbId, tmdbId } = event.item;

  const resolvedTmdbId =
    tmdbId ?? (imdbId && (await api.getTmdbIdFromImdbId(imdbId)));

  if (!resolvedTmdbId) {
    throw new UnrecoverableError(
      `Unable to determine TMDB ID for media item ${event.item.id.toString()}`,
    );
  }

  const result = await api.getMovieDetails(resolvedTmdbId.toString());

  return {
    item: {
      id: event.item.id,
      genres: (result.genres ?? []).reduce<string[]>((acc, genre) => {
        if (!genre.name) {
          return acc;
        }

        return [...acc, genre.name];
      }, []),
      title: result.title ?? "Unknown title",
      aliases: {},
      country: result.production_countries?.[0]?.iso_3166_1,
      rating: 0,
      contentRating: "-",
      posterUrl: result.poster_path
        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
        : null,
      releaseDate: result.release_date,
    },
  };
};

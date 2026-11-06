import { UnrecoverableError } from "@repo/util-plugin-sdk/errors/unrecoverable-error";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";

import type { MovieAlternativeTitles200Schema } from "../__generated__/zod/movieAlternativeTitlesSchema.ts";
import type { MediaItemIndexRequestedMovieEventHandler } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
import type z from "zod";

/**
 * Collects the aliases for a movie, keyed by language.
 */
function mapAliases(
  alternativeTitles: MovieAlternativeTitles200Schema,
  title: string,
) {
  const aliases = new Map<string, Set<string>>();

  for (const {
    iso_3166_1: country,
    title: alternativeTitle,
  } of alternativeTitles.titles ?? []) {
    // Ignore translations that are identical to the main title;
    // these add no value to the list.
    if (
      !alternativeTitle ||
      !country ||
      title.toLowerCase() === alternativeTitle.toLowerCase()
    ) {
      continue;
    }

    const normalisedLanguage = country.toLowerCase();
    const languageAliases =
      aliases.get(normalisedLanguage) ?? new Set<string>();

    aliases.set(
      normalisedLanguage,
      languageAliases.add(alternativeTitle.toLowerCase()),
    );
  }

  return aliases;
}

export const indexTMDBMediaItem: z.infer<
  typeof MediaItemIndexRequestedMovieEventHandler
> = async ({ dataSources, event }) => {
  if (event.item.type !== "movie") {
    return null;
  }

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
      `Unable to determine TMDB ID for media item ${event.item.id}`,
    );
  }

  const result = await api.getMovieDetails(resolvedTmdbId.toString());

  const aliases = await api.getMovieAlternativeTitles(
    resolvedTmdbId.toString(),
  );
  const aliasMap = mapAliases(aliases, result.title ?? "Unknown title");

  const genres: string[] = [];

  for (const genre of result.genres) {
    if (genre.name) {
      genres.push(genre.name);
    }
  }

  return {
    item: {
      id: event.item.id,
      type: "movie",
      imdbId: imdbId ?? result.imdb_id ?? null,
      genres,
      title: result.title ?? "Unknown title",
      aliases: Object.fromEntries(
        aliasMap.entries().map(([key, value]) => [key, [...value]]),
      ),
      country: result.production_countries?.[0]?.iso_3166_1,
      rating: 0,
      contentRating: "unknown",
      posterUrl: result.poster_path
        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
        : null,
      releaseDate: result.release_date
        ? DateTime.fromISO(result.release_date, { zone: "utc" }).toISO({
            precision: "minute",
          })
        : null,
      runtime: result.runtime ?? null,
      language: result.original_language ?? null,
    },
  };
};

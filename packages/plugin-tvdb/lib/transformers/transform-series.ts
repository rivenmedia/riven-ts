import { ShowContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import assert from "node:assert";
import z from "zod";

import type {
  EpisodeBaseRecordSchema,
  SeriesExtendedRecordSchema,
} from "../__generated__/index.ts";
import type {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedPluginResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

function findEnglishShowTitle(series: SeriesExtendedRecordSchema) {
  if (series.originalLanguage === "eng") {
    return series.name ?? null;
  }

  const translation = series.translations?.nameTranslations?.find(
    ({ language, isAlias }) => language === "eng" && !isAlias,
  );

  return translation?.name ?? null;
}

export const transformSeries = (
  itemRequest: MediaItemIndexRequestedEvent["item"],
  series: SeriesExtendedRecordSchema,
  allEpisodes: EpisodeBaseRecordSchema[],
  releaseDateTime: DateTime | null,
) => {
  const imdbId =
    itemRequest.imdbId ??
    series.remoteIds?.find((id) => id.sourceName?.toLowerCase() === "imdb")
      ?.id ??
    null;

  const {
    slug = "",
    image: posterPath,
    status: { name: tvdbStatus, keepUpdated } = {},
  } = series;

  const title = findEnglishShowTitle(series);

  assert(title, "Series must have a name");

  const firstAired = series.firstAired
    ? DateTime.fromISO(series.firstAired)
    : null;

  assert(firstAired);

  const network =
    series.latestNetwork?.name ?? series.originalNetwork?.name ?? null;

  const aliases = (series.translations?.nameTranslations ?? []).reduce<
    Map<string, Set<string>>
  >(
    (acc, { language, name }) => {
      if (!name || !language) {
        return acc;
      }

      // Ignore english translations, we already have the English show title
      if (language === "eng") {
        return acc;
      }

      // Ignore translations that are identical to the main show title;
      // these add no value to the list.
      if (name === title) {
        return acc;
      }

      const existing = acc.get(language) ?? new Set<string>();

      return acc.set(language, existing.add(name));
    },
    new Map<string, Set<string>>([["eng", new Set([slug])]]),
  );

  const genres = series.genres
    ? series.genres.reduce<string[]>((acc, genre) => {
        if (!genre.name) {
          return acc;
        }

        return [...acc, genre.name];
      }, [])
    : [];

  const sanitisedTitle = title.replaceAll(/\s*\(.*\)\s*$/g, "");

  const contentRating = z
    .string()
    .toLowerCase()
    .pipe(ShowContentRating)
    .default("unknown")
    .parse(
      series.contentRatings?.find(({ country }) => country === "usa")?.name,
    );

  const seasons = allEpisodes.reduce<
    Extract<
      NonNullable<MediaItemIndexRequestedPluginResponse>["item"],
      { type: "show" }
    >["seasons"]
  >((acc, episode) => {
    const { seasonNumber, number } = episode;

    if (seasonNumber === undefined || number === undefined) {
      return acc;
    }

    const season = acc[seasonNumber] ?? {
      number: seasonNumber,
      title: episode.seasonName ?? null,
      episodes: [],
    };

    return {
      ...acc,
      [seasonNumber]: {
        ...season,
        episodes: [
          ...season.episodes,
          {
            contentRating, // TODO: Get episode-specific content rating
            number,
            absoluteNumber: episode.absoluteNumber ?? 0,
            title: episode.name ?? "Unknown",
            posterPath: episode.image
              ? new URL(
                  episode.image,
                  "https://artworks.thetvdb.com",
                ).toString()
              : posterPath,
            airedAt: episode.aired
              ? DateTime.fromISO(episode.aired).toISO({
                  precision: "day",
                  includeOffset: false,
                })
              : null,
            runtime: episode.runtime ?? null,
          },
        ],
      },
    };
  }, {});

  return {
    id: itemRequest.id,
    type: "show",
    imdbId,
    title: sanitisedTitle,
    genres,
    network,
    country: series.originalCountry,
    aliases: Object.fromEntries(
      Array.from(aliases.entries()).map(([key, value]) => [
        key,
        Array.from(value),
      ]),
    ),
    contentRating,
    posterUrl: posterPath,
    status: tvdbStatus === "Continuing" ? "continuing" : "ended",
    firstAired: firstAired.toISO({
      precision: "day",
      includeOffset: false,
    }),
    nextAired: releaseDateTime?.toISO({ precision: "minute" }) ?? null,
    seasons,
    keepUpdated: keepUpdated ?? false,
  } satisfies Extract<
    NonNullable<MediaItemIndexRequestedPluginResponse>["item"],
    { type: "show" }
  >;
};

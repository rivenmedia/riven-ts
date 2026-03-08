import { ShowContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import assert from "node:assert";
import z from "zod";

import type {
  EpisodeBaseRecordSchema,
  SeriesExtendedRecordSchema,
  TranslationSchema,
} from "../__generated__/index.ts";
import type {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedPluginResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const transformSeries = (
  eventItem: MediaItemIndexRequestedEvent["item"],
  series: SeriesExtendedRecordSchema,
  allEpisodes: EpisodeBaseRecordSchema[],
  translation: TranslationSchema | null,
) => {
  const imdbId =
    eventItem.imdbId ??
    series.remoteIds?.find((id) => id.sourceName?.toLowerCase() === "imdb")
      ?.id ??
    null;

  const {
    slug = "",
    image: posterPath,
    status: { name: tvdbStatus } = {},
  } = series;

  const title = translation?.name ?? series.name;

  assert(title, "Series must have a name");

  const firstAired = series.firstAired
    ? DateTime.fromISO(series.firstAired)
    : null;

  assert(firstAired);

  const network =
    series.latestNetwork?.name ?? series.originalNetwork?.name ?? null;

  const aliases = new Map<string, Set<string>>([
    ["us", new Set([slug, ...(translation?.aliases ?? [])])],
  ]);

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
    id: eventItem.id,
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
    seasons,
  } satisfies Extract<
    NonNullable<MediaItemIndexRequestedPluginResponse>["item"],
    { type: "show" }
  >;
};

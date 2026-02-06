import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import assert from "node:assert";

import type {
  SeasonExtendedRecordSchema,
  SeriesExtendedRecordSchema,
} from "../__generated__/index.ts";
import type {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedPluginResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

type Episode = Extract<
  NonNullable<MediaItemIndexRequestedPluginResponse>["item"],
  { type: "show" }
>["seasons"][number]["episodes"][number];

export const transformSeries = (
  eventItem: MediaItemIndexRequestedEvent["item"],
  series: SeriesExtendedRecordSchema,
  seasons: SeasonExtendedRecordSchema[],
  imdbId = series.remoteIds?.find(
    (id) => id.sourceName?.toLowerCase() === "imdb",
  )?.id,
) => {
  const {
    slug = "",
    name: title,
    image: posterPath,
    status: { name: tvdbStatus } = {},
  } = series;

  if (!title) {
    throw new Error("Series must have a name");
  }

  const firstAired = series.firstAired
    ? DateTime.fromISO(series.firstAired)
    : null;

  assert(firstAired);

  const network =
    series.latestNetwork?.name ?? series.originalNetwork?.name ?? null;

  // TODO: Fetch from Trakt
  const aliases = new Map<string, Set<string>>();

  aliases.set("us", new Set([slug]));

  // TODO: Get translations

  const genres =
    series.genres?.reduce<string[]>((acc, genre) => {
      if (!genre.name) {
        return acc;
      }

      return [...acc, genre.name];
    }, []) ?? [];

  const sanitisedTitle = title.replaceAll(/\s*\(.*\)\s*$/g, "");

  const contentRating = series.contentRatings?.find(
    ({ country }) => country === "usa",
  )?.name;

  return {
    id: eventItem.id,
    type: "show",
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
    seasons: seasons.map((season) => {
      assert(season.number !== undefined, "Season must have a number");

      return {
        number: season.number,
        episodes:
          season.episodes?.reduce<Episode[]>((acc, episode) => {
            assert(episode.name);
            assert(episode.number !== undefined, "Episode must have a number");

            return [
              ...acc,
              {
                contentRating: contentRating ?? null, // TODO: Get episode-specific content rating
                number: episode.number,
                title: episode.name,
                posterPath: episode.image,
                airedAt: episode.aired
                  ? DateTime.fromISO(episode.aired).toISO({
                      precision: "day",
                      includeOffset: false,
                    })
                  : null,
                runtime: episode.runtime ?? null,
              } satisfies Episode,
            ];
          }, [] as Episode[]) ?? [],
      };
    }),
  } satisfies Extract<
    NonNullable<MediaItemIndexRequestedPluginResponse>["item"],
    { type: "show" }
  >;
};

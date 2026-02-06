import { DateTime } from "luxon";

import type { SeriesExtendedRecordSchema } from "../__generated__/index.ts";
import type {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export const transformSeries = (
  eventItem: MediaItemIndexRequestedEvent["item"],
  series: SeriesExtendedRecordSchema,
  imdbId = series.remoteIds?.find(
    (id) => id.sourceName?.toLowerCase() === "imdb",
  )?.id,
): Extract<
  NonNullable<MediaItemIndexRequestedResponse>["item"],
  { type: "show" }
> => {
  const {
    slug = "",
    name: title,
    image: posterPath,
    status: { name: tvdbStatus } = {},
  } = series;

  if (!title) {
    throw new Error("Series must have a name");
  }

  const airedAt = series.firstAired
    ? DateTime.fromISO(series.firstAired)
    : null;

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
    airedAt: airedAt
      ? airedAt.toISO({
          precision: "day",
          includeOffset: false,
        })
      : null,
    year: airedAt ? airedAt.year : null,
    seasons: series.seasons?.map((season) => ({
      number: season.number,
      year: season.firstAired ? DateTime.fromISO(season.firstAired).year : null,
    })),
  };
};

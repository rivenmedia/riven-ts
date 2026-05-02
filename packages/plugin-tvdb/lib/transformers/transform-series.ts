import { ShowContentRating } from "@rivenmedia/plugin-sdk/dto/enums/content-ratings.enum";
import { DateTime } from "@rivenmedia/plugin-sdk/helpers/dates";

import assert from "node:assert";
import z from "zod";

import type { EpisodeBaseRecordSchema } from "../__generated__/zod/episodeBaseRecordSchema.ts";
import type { SeriesExtendedRecordSchema } from "../__generated__/zod/seriesExtendedRecordSchema.ts";
import type { ItemRequest } from "@rivenmedia/plugin-sdk/dto/entities";
import type { MediaItemIndexRequestedShowResponse } from "@rivenmedia/plugin-sdk/schemas/events/media-item.index.requested.event";
import type { TimezoneName } from "countries-and-timezones";

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
  itemRequest: ItemRequest,
  series: SeriesExtendedRecordSchema,
  allEpisodes: EpisodeBaseRecordSchema[],
  originalReleaseTimezone: TimezoneName | undefined,
) => {
  const imdbId =
    itemRequest.imdbId ??
    series.remoteIds?.find((id) => id.sourceName?.toLowerCase() === "imdb")
      ?.id ??
    null;

  const {
    slug = "",
    image: posterPath,
    status: { name: tvdbStatus } = {},
    airsTime,
  } = series;

  const title = findEnglishShowTitle(series);

  assert(title, "Series must have a name");

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

        acc.push(genre.name);

        return acc;
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

  const airsDateTime = DateTime.fromFormat(airsTime ?? "00:00", "HH:mm");

  const seasons = allEpisodes.reduce<
    Extract<
      NonNullable<MediaItemIndexRequestedShowResponse>["item"],
      { type: "show" }
    >["seasons"]
  >((acc, episode) => {
    const { seasonNumber, number } = episode;

    if (seasonNumber === undefined || number === undefined) {
      return acc;
    }

    const episodeAiredDate = episode.aired
      ? DateTime.fromISO(episode.aired)
      : null;

    const episodeAiredAtUtc = episodeAiredDate
      ? DateTime.fromObject(
          {
            year: episodeAiredDate.year,
            month: episodeAiredDate.month,
            day: episodeAiredDate.day,
            hour: airsDateTime.hour,
            minute: airsDateTime.minute,
          },
          { zone: originalReleaseTimezone },
        ).toUTC()
      : null;

    acc[seasonNumber] ??= {
      number: seasonNumber,
      title: null,
      episodes: [],
    };

    acc[seasonNumber].episodes.push({
      contentRating, // TODO: Get episode-specific content rating
      number,
      absoluteNumber: episode.absoluteNumber ?? 0,
      title: episode.name ?? "Unknown",
      posterPath: episode.image
        ? new URL(episode.image, "https://artworks.thetvdb.com").toString()
        : posterPath,
      airedAt: episodeAiredAtUtc?.toISO({ precision: "minute" }) ?? null,
      runtime: episode.runtime ?? null,
    });

    return acc;
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
    status: tvdbStatus?.toLowerCase() === "continuing" ? "continuing" : "ended",
    seasons,
    language: series.originalLanguage,
  } satisfies Extract<
    NonNullable<MediaItemIndexRequestedShowResponse>["item"],
    { type: "show" }
  >;
};

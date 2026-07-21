import { ShowContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import assert from "node:assert";
import z from "zod";

import type { EpisodeBaseRecordSchema } from "../__generated__/zod/episodeBaseRecordSchema.ts";
import type { SeriesExtendedRecordSchema } from "../__generated__/zod/seriesExtendedRecordSchema.ts";
import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { MediaItemIndexRequestedShowResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
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

  assert.ok(title, "Series must have a name");

  const network =
    series.latestNetwork?.name ?? series.originalNetwork?.name ?? null;

  const aliases = new Map<string, Set<string>>([["eng", new Set([slug])]]);

  for (const { language, name } of series.translations?.nameTranslations ??
    []) {
    if (!name || !language) {
      continue;
    }

    // Ignore english translations, we already have the English show title
    if (language === "eng") {
      continue;
    }

    // Ignore translations that are identical to the main show title;
    // these add no value to the list.
    if (name === title) {
      continue;
    }

    const existing = aliases.get(language) ?? new Set<string>();
    aliases.set(language, existing.add(name));
  }

  const genres: string[] = [];

  if (series.genres) {
    for (const genre of series.genres) {
      if (genre.name) {
        genres.push(genre.name);
      }
    }
  }

  const sanitisedTitle = title.replaceAll(/\s*\(.*\)\s*$/gu, "");

  const contentRating = z
    .string()
    .toLowerCase()
    .pipe(ShowContentRating)
    .default("unknown")
    .parse(
      series.contentRatings?.find(({ country }) => country === "usa")?.name,
    );

  const airsDateTime = DateTime.fromFormat(airsTime ?? "00:00", "HH:mm");

  const seasons: Extract<
    NonNullable<MediaItemIndexRequestedShowResponse>["item"],
    { type: "show" }
  >["seasons"] = {};

  for (const episode of allEpisodes) {
    const { seasonNumber, number } = episode;

    if (seasonNumber === undefined || number === undefined) {
      continue;
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

    seasons[seasonNumber] ??= {
      number: seasonNumber,
      title: null,
      episodes: [],
    };

    seasons[seasonNumber].episodes.push({
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
  }

  return {
    id: itemRequest.id,
    type: "show",
    imdbId,
    title: sanitisedTitle,
    genres,
    network,
    country: series.originalCountry,
    aliases: Object.fromEntries(
      [...aliases.entries()].map(([key, value]) => [key, [...value]]),
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

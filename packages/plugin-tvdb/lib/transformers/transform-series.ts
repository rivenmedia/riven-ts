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

/**
 * Collects the non-English aliases for a series, keyed by language.
 */
function getAliases(
  series: SeriesExtendedRecordSchema,
  slug: string,
  title: string,
) {
  const aliases = new Map<string, Set<string>>([["eng", new Set([slug])]]);

  for (const { language, name } of series.translations?.nameTranslations ??
    []) {
    // Ignore english translations, we already have the English show title.
    // Also ignore translations that are identical to the main show title;
    // these add no value to the list.
    if (!name || !language || language === "eng" || name === title) {
      continue;
    }

    const existing = aliases.get(language) ?? new Set<string>();

    aliases.set(language, existing.add(name));
  }

  return aliases;
}

/**
 * Removes a trailing parenthetical from a title, e.g. "Show (2024)" becomes "Show".
 */
function removeTrailingParenthetical(title: string) {
  const trimmedTitle = title.trimEnd();
  const openingParenthesisIndex = trimmedTitle.indexOf("(");

  if (!trimmedTitle.endsWith(")") || openingParenthesisIndex === -1) {
    return title;
  }

  return trimmedTitle.slice(0, openingParenthesisIndex).trimEnd();
}

function getEpisodeAiredAtUtc(
  episode: EpisodeBaseRecordSchema,
  airsDateTime: DateTime,
  originalReleaseTimezone: TimezoneName | undefined,
) {
  if (!episode.aired) {
    return null;
  }

  const episodeAiredDate = DateTime.fromISO(episode.aired);

  return DateTime.fromObject(
    {
      year: episodeAiredDate.year,
      month: episodeAiredDate.month,
      day: episodeAiredDate.day,
      hour: airsDateTime.hour,
      minute: airsDateTime.minute,
    },
    { zone: originalReleaseTimezone },
  ).toUTC();
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

  const aliases = getAliases(series, slug, title);

  const genres = (series.genres ?? []).flatMap(({ name }) =>
    name ? [name] : [],
  );

  const sanitisedTitle = removeTrailingParenthetical(title);

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

    const episodeAiredAtUtc = getEpisodeAiredAtUtc(
      episode,
      airsDateTime,
      originalReleaseTimezone,
    );

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

import { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import { DateTime, Duration } from "@repo/util-plugin-sdk/helpers/dates";

import type { SearchResultSchema } from "../__generated__/zod/searchResultSchema.ts";
import type { SeriesExtendedRecordSchema } from "../__generated__/zod/seriesExtendedRecordSchema.ts";
import type { TvdbIndexerData } from "../schema/types/tvdb-indexer-data.type.ts";

const statusMap: Record<string, IndexerDataStatus> = {
  continuing: "ongoing",
  ended: "released",
  upcoming: "unreleased",
};

const parseStatus = (status: string | null | undefined) =>
  statusMap[status?.toLowerCase() ?? ""] ?? IndexerDataStatus.parse(status);

const parseDate = (date: string | null | undefined) =>
  date ? DateTime.fromISO(date).toJSDate() : null;

/**
 * @returns The mapped series, or null if it is missing required fields
 */
export const transformSearchResult = (
  result: SearchResultSchema,
): TvdbIndexerData | null => {
  if (!result.tvdb_id || !result.name) {
    return null;
  }

  return {
    id: result.tvdb_id,
    title: result.translations?.["eng"] ?? result.name,
    overview: result.overviews?.["eng"] ?? result.overview ?? "",
    posterUrl: result.image_url ?? null,
    language: result.primary_language ?? null,
    releaseDate: parseDate(result.first_air_time),
    genres: (result.genres ?? []).map((name) => ({ id: name, name })),
    type: "show",
    status: parseStatus(result.status),
    originCountry: result.country ? [result.country] : null,
    isRequestable: true,
  };
};

export const transformSeriesToIndexerData = (
  series: SeriesExtendedRecordSchema,
): TvdbIndexerData => ({
  id: String(series.id),
  title: series.name ?? "",
  overview: series.overview ?? "",
  posterUrl: series.image ?? null,
  language: series.originalLanguage ?? null,
  releaseDate: parseDate(series.firstAired),
  genres: (series.genres ?? []).map(({ id, name = "" }) => ({
    id: String(id),
    name,
  })),
  type: "show",
  rawRuntime: series.averageRuntime
    ? Duration.fromObject({ minutes: series.averageRuntime })
    : null,
  status: parseStatus(series.status?.name),
  originCountry: series.originalCountry ? [series.originalCountry] : null,
  isRequestable: Boolean(series.id),
});

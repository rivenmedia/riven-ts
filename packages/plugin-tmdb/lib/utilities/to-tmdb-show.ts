import { Duration } from "@repo/util-plugin-sdk/helpers/dates";

import { createTmdbShow } from "./create-tmdb-indexer-data.ts";
import { formatImageUrl } from "./format-image-url.ts";
import { mapShowStatus } from "./map-show-status.ts";
import { parseTmdbDate } from "./parse-tmdb-date.ts";

import type { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import type { TmdbIndexerData } from "../schema/types/tmdb-indexer-data.type.ts";
import type { ShowDetails } from "../schemas/show-details.schema.ts";
import type { ShowListItem } from "../schemas/show-list-item.schema.ts";

interface ListItemImageSizes {
  backdrop: Parameters<typeof formatImageUrl<"backdrop">>[2];
  poster: Parameters<typeof formatImageUrl<"poster">>[2];
}

const defaultImageSizes: ListItemImageSizes = {
  backdrop: "original",
  poster: "original",
};

export function showDetailsToTmdbShow(details: ShowDetails): TmdbIndexerData {
  const runtime =
    details.episode_run_time[0] ?? details.last_episode_to_air?.runtime;

  return createTmdbShow({
    tmdbId: details.id.toString(),
    tvdbId: details.external_ids.tvdb_id?.toString() ?? null,
    imdbId: details.external_ids.imdb_id ?? null,
    title: details.name,
    overview: details.overview,
    genres: details.genres.map((genre) => ({
      id: genre.id.toString(),
      name: genre.name,
    })),
    language: details.original_language,
    posterUrl: formatImageUrl(details.poster_path, "poster"),
    backdropUrl: formatImageUrl(details.backdrop_path, "backdrop"),
    releaseDate: parseTmdbDate(details.first_air_date),
    rawRuntime: runtime ? Duration.fromObject({ minutes: runtime }) : null,
    status: mapShowStatus(details.status),
    // TMDB returns an empty string when a show has no homepage
    homepage: details.homepage === "" ? null : (details.homepage ?? null),
    originCountry: details.origin_country,
    budget: null,
    revenue: null,
    spokenLanguages: details.spoken_languages.map((language) => ({
      englishName: language.english_name,
      iso6391Code: language.iso_639_1,
      name: language.name,
    })),
    productionCompanies: details.production_companies.map((company) => ({
      id: company.id.toString(),
      name: company.name,
      logoPath: formatImageUrl(company.logo_path, "logo"),
      originCountry: company.origin_country,
    })),
  });
}

/**
 * Maps TMDB's paged TV list results to {@link TmdbIndexerData}, resolving each show's TVDB ID.
 *
 * TMDB list endpoints only return TMDB IDs, so each show's external IDs are fetched in parallel.
 * These lookups are cached for a long time, so the cost is only paid once per show.
 *
 * Shows without a TVDB ID (or whose lookup fails) are kept, but are not requestable.
 */
export async function showListItemsToTmdbShows(
  api: TmdbAPI,
  items: ShowListItem[],
  imageSizes = defaultImageSizes,
): Promise<TmdbIndexerData[]> {
  const uniqueItems = [
    ...new Map(items.map((item) => [item.id, item])).values(),
  ];

  const externalIds = await Promise.allSettled(
    uniqueItems.map((item) => api.getShowExternalIds(item.id.toString())),
  );

  return uniqueItems.map((item, index) => {
    const externalIdsResult = externalIds[index];

    if (externalIdsResult?.status === "rejected") {
      api.logger.warn(
        `Unable to resolve external IDs for TMDB show ${item.id.toString()}`,
        { err: externalIdsResult.reason as unknown },
      );
    }

    const ids =
      externalIdsResult?.status === "fulfilled"
        ? externalIdsResult.value
        : null;

    return createTmdbShow({
      tmdbId: item.id.toString(),
      tvdbId: ids?.tvdb_id?.toString() ?? null,
      imdbId: ids?.imdb_id ?? null,
      title: item.name,
      overview: item.overview,
      genres: [],
      genreIds: item.genre_ids,
      language: item.original_language,
      posterUrl: formatImageUrl(item.poster_path, "poster", imageSizes.poster),
      backdropUrl: formatImageUrl(
        item.backdrop_path,
        "backdrop",
        imageSizes.backdrop,
      ),
      releaseDate: parseTmdbDate(item.first_air_date),
      originCountry: item.origin_country ?? null,
      rawRuntime: null,
      status: "unknown",
    });
  });
}

import { createTmdbMovie } from "../utilities/create-tmdb-indexer-data.ts";
import { formatImageUrl } from "../utilities/format-image-url.ts";
import { parseTmdbDate } from "../utilities/parse-tmdb-date.ts";

import type { TmdbMediaAdapter } from "./tmdb-media-adapter.ts";

export const movieAdapter: TmdbMediaAdapter = {
  mediaType: "movie",

  async getCertification(api, item, locale) {
    const releaseDates = await api.getReleaseDates(item.tmdbId);

    if (!releaseDates.results?.length) {
      throw new Error(`Unable to find release dates for TMDB ID ${item.id}`);
    }

    // Pull the iso_639_1 language & iso_3166_1 country codes from the locale, e.g. "en-GB" -> ["en", "gb"]
    const [iso_639_1, iso_3166_1] = locale.includes("-")
      ? locale.toLowerCase().split("-")
      : [locale.toLowerCase()];
    const fallbackLocaleId = "US".toLowerCase();

    type ReleaseDatesList =
      (typeof releaseDates.results)[number]["release_dates"];

    let fallbackReleaseDates: ReleaseDatesList | null = null;
    let matchedReleaseDates: ReleaseDatesList | null = null;

    for (const result of releaseDates.results) {
      if (result.iso_3166_1?.toLowerCase() === iso_3166_1) {
        const releaseDatesForLanguage =
          iso_639_1 && result.release_dates
            ? result.release_dates.filter(
                (localReleaseDate) =>
                  localReleaseDate.iso_639_1?.toLowerCase() === iso_639_1,
              )
            : [];

        matchedReleaseDates =
          releaseDatesForLanguage.length > 0
            ? releaseDatesForLanguage
            : result.release_dates;

        break;
      }

      // Pull the fallback release dates now in case the requested release dates are not available;
      // it saves an additional loop through the results later if needed
      if (result.iso_3166_1?.toLowerCase() === fallbackLocaleId) {
        fallbackReleaseDates = result.release_dates ?? [];
      }
    }

    const resolvedReleaseDates = matchedReleaseDates ?? fallbackReleaseDates;

    if (!resolvedReleaseDates?.length) {
      throw new Error(
        `Unable to find release dates for TMDB ID ${item.id} in locale ${locale} or fallback locale ${fallbackLocaleId}`,
      );
    }

    const allowedReleaseTypes = new Set([3, 4, 5]);
    const { certification } =
      resolvedReleaseDates.find(
        (releaseDate) =>
          releaseDate.certification &&
          releaseDate.type != null &&
          allowedReleaseTypes.has(releaseDate.type),
      ) ?? {};

    return certification ?? null;
  },

  async getImdbId(api, item) {
    if (item.imdbId) {
      return item.imdbId;
    }

    const externalIds = await api.getExternalIds(item.tmdbId);

    return externalIds.imdb_id ?? null;
  },

  async getRecommendations(api, item) {
    const { results: recommendations } = await api.getMovieRecommendations(
      item.tmdbId,
    );

    if (recommendations.length === 0) {
      return null;
    }

    return recommendations.map((recommendation) =>
      createTmdbMovie({
        id: recommendation.id.toString(),
        overview: recommendation.overview,
        title: recommendation.title,
        backdropUrl: formatImageUrl(
          recommendation.backdrop_path,
          "backdrop",
          "original",
        ),
        posterUrl: formatImageUrl(recommendation.poster_path, "poster", "w185"),
        releaseDate: parseTmdbDate(recommendation.release_date),
        genreIds: recommendation.genre_ids,
        genres: [],
        rawRuntime: null,
        status: "unknown",
      }),
    );
  },

  async getSimilarItems(api, item) {
    const { results: similarItems } = await api.getSimilarMovies(item.tmdbId);

    if (similarItems.length === 0) {
      return null;
    }

    return similarItems.map((similarItem) =>
      createTmdbMovie({
        id: similarItem.id.toString(),
        overview: similarItem.overview,
        title: similarItem.title,
        backdropUrl: formatImageUrl(
          similarItem.backdrop_path,
          "backdrop",
          "w780",
        ),
        posterUrl: formatImageUrl(similarItem.poster_path, "poster", "w185"),
        releaseDate: parseTmdbDate(similarItem.release_date),
        genreIds: similarItem.genre_ids,
        genres: [],
        rawRuntime: null,
        status: "unknown",
      }),
    );
  },

  async getCast(api, item, language) {
    const { cast } = await api.getLocalisedCredits(item.tmdbId, language);

    if (cast.length === 0) {
      return null;
    }

    return cast.map((member) => ({
      id: member.id.toString(),
      name: member.name,
      character: member.character,
      profileUrl: formatImageUrl(member.profile_path, "profile", "w185"),
    }));
  },
};

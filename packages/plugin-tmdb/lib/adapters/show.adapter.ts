import { formatImageUrl } from "../utilities/format-image-url.ts";
import { showListItemsToTmdbShows } from "../utilities/to-tmdb-show.ts";

import type { TmdbMediaAdapter } from "./tmdb-media-adapter.ts";

export const showAdapter: TmdbMediaAdapter = {
  mediaType: "tv",

  async getCertification(api, item, locale) {
    const { results } = await api.getShowContentRatings(item.tmdbId);

    const region = new Intl.Locale(locale).region ?? "US";

    const contentRating =
      results.find((result) => result.iso_3166_1 === region) ??
      results.find((result) => result.iso_3166_1 === "US");

    return contentRating?.rating ?? null;
  },

  async getImdbId(api, item) {
    if (item.imdbId !== undefined) {
      return item.imdbId;
    }

    const externalIds = await api.getShowExternalIds(item.tmdbId);

    return externalIds.imdb_id ?? null;
  },

  async getRecommendations(api, item) {
    const { results } = await api.getShowRecommendations(item.tmdbId);

    if (results.length === 0) {
      return null;
    }

    return showListItemsToTmdbShows(api, results, {
      backdrop: "original",
      poster: "w185",
    });
  },

  async getSimilarItems(api, item) {
    const { results } = await api.getSimilarShows(item.tmdbId);

    if (results.length === 0) {
      return null;
    }

    return showListItemsToTmdbShows(api, results, {
      backdrop: "w780",
      poster: "w185",
    });
  },

  async getCast(api, item, language) {
    // Aggregate credits cover every season, whereas regular credits only cover the latest season
    const { cast } = await api.getLocalisedShowAggregateCredits(
      item.tmdbId,
      language,
    );

    if (cast.length === 0) {
      return null;
    }

    return cast.map((member) => {
      // Actors can play several characters over a show's run; use their most prominent role
      const [mainRole] = member.roles.toSorted(
        (a, b) => b.episode_count - a.episode_count,
      );

      return {
        id: member.id.toString(),
        name: member.name,
        character: mainRole?.character ?? "",
        profileUrl: formatImageUrl(member.profile_path, "profile", "w185"),
      };
    });
  },
};

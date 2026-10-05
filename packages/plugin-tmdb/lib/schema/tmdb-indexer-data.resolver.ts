import { PluginDataSource } from "@repo/util-plugin-sdk";
import { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";
import { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";
import { ItemImage } from "@repo/util-plugin-sdk/dto/types/item-image.type";
import { Trailer } from "@repo/util-plugin-sdk/dto/types/trailer.type";

import { Arg, FieldResolver, Float, Int, Resolver, Root } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import { formatImageUrl } from "../utilities/format-image-url.ts";
import { TmdbIndexerData } from "./types/tmdb-indexer-data.type.ts";

import type { MovieImage } from "../schemas/movie-image.schema.ts";
import type { ResolverInterface } from "type-graphql";

const byRating = (a: MovieImage, b: MovieImage) =>
  b.vote_average - a.vote_average || b.vote_count - a.vote_count;

@Resolver((_of) => TmdbIndexerData)
export class TmdbIndexerDataResolver implements ResolverInterface<TmdbIndexerData> {
  @FieldResolver(() => [Genre], { name: "genres" })
  public async genres(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @Arg("locale", { defaultValue: "en-US" }) locale: string,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<Genre[]> {
    if (
      tmdbIndexerData.genreIds?.length === 0 &&
      tmdbIndexerData.genres.length === 0
    ) {
      return [];
    }

    if (tmdbIndexerData.genres.length > 0) {
      return tmdbIndexerData.genres;
    }

    const localisedGenres = await api.getLocalisedGenres(locale);
    const genreIdSet = new Set(tmdbIndexerData.genreIds);

    return localisedGenres.filter((genre) =>
      genreIdSet.has(Math.trunc(Number(genre.id))),
    );
  }

  @FieldResolver(() => String, { nullable: true })
  public async certification(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @Arg("locale", { defaultValue: "en-US" }) locale: string,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<string | null> {
    const releaseDates = await api.getReleaseDates(tmdbIndexerData.id);

    if (!releaseDates.results?.length) {
      throw new Error(
        `Unable to find release dates for TMDB ID ${tmdbIndexerData.id}`,
      );
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
        `Unable to find release dates for TMDB ID ${tmdbIndexerData.id} in locale ${locale} or fallback locale ${fallbackLocaleId}`,
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
  }

  @FieldResolver(() => String, { nullable: true })
  public async imdbId(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<string | null> {
    if (tmdbIndexerData.imdbId) {
      return tmdbIndexerData.imdbId;
    }

    const externalIds = await api.getExternalIds(tmdbIndexerData.id);

    return externalIds.imdb_id ?? null;
  }

  @FieldResolver(() => Trailer, { nullable: true })
  public async trailer(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
    @Arg("language", () => String, { nullable: true, defaultValue: "en-US" })
    language: string,
  ): Promise<Trailer | null> {
    const { results: videos } = await api.getLocalisedVideos(
      tmdbIndexerData.id,
      language,
    );

    if (videos.length === 0) {
      return null;
    }

    const { language: iso_639_1 } = new Intl.Locale(language);

    const officialTrailers = videos.filter(
      (video) =>
        video.type === "Trailer" &&
        video.official &&
        video.iso_639_1 === iso_639_1,
    );

    if (officialTrailers.length === 0) {
      return null;
    }

    const [highestResolutionTrailer] = officialTrailers.toSorted(
      (a, b) => b.size - a.size,
    );

    if (!highestResolutionTrailer) {
      return null;
    }

    return {
      id: highestResolutionTrailer.id,
      key: highestResolutionTrailer.key,
      name: highestResolutionTrailer.name,
      site: highestResolutionTrailer.site,
      url: `https://www.youtube.com/watch?v=${highestResolutionTrailer.key}`,
    };
  }

  @FieldResolver(() => [TmdbIndexerData], { nullable: true })
  public async recommendations(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData[] | null> {
    const { results: recommendations } = await api.getRecommendations(
      tmdbIndexerData.id,
    );

    if (recommendations.length === 0) {
      return null;
    }

    return recommendations.map((recommendation) => ({
      id: recommendation.id.toString(),
      overview: recommendation.overview,
      title: recommendation.title,
      type: "movie",
      backdropUrl: formatImageUrl(
        recommendation.backdrop_path,
        "backdrop",
        "original",
      ),
      posterUrl: formatImageUrl(recommendation.poster_path, "poster", "w185"),
      genreIds: recommendation.genre_ids,
      genres: [],
      rawRuntime: null,
    }));
  }

  @FieldResolver(() => [TmdbIndexerData], { nullable: true })
  public async similarItems(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData[] | null> {
    const { results: similarItems } = await api.getSimilarItems(
      tmdbIndexerData.id,
    );

    if (similarItems.length === 0) {
      return null;
    }

    return similarItems.map((item) => ({
      id: item.id.toString(),
      overview: item.overview,
      title: item.title,
      type: "movie",
      backdropUrl: formatImageUrl(item.backdrop_path, "backdrop", "w780"),
      posterUrl: formatImageUrl(item.poster_path, "poster", "w185"),
      genreIds: item.genre_ids,
      genres: [],
      rawRuntime: null,
    }));
  }

  @FieldResolver(() => [CastMember], { nullable: true })
  public async cast(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
    @Arg("language", () => String, { defaultValue: "en-US" }) language: string,
  ): Promise<CastMember[] | null> {
    const { cast } = await api.getLocalisedCredits(
      tmdbIndexerData.id,
      language,
    );

    if (cast.length === 0) {
      return null;
    }

    return cast.map((member) => ({
      id: member.id.toString(),
      name: member.name,
      character: member.character,
      profileUrl: formatImageUrl(member.profile_path, "profile", "w185"),
    }));
  }

  @FieldResolver(() => ItemImage, { nullable: true })
  public async logo(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @Arg("width", () => Int, {
      defaultValue: null,
      nullable: true,
    })
    width: number | null,
    @Arg("aspectRatio", () => Float, {
      defaultValue: null,
      nullable: true,
    })
    aspectRatio: number | null,
    @Arg("language", () => String, { defaultValue: "en-US" }) language: string,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<ItemImage | null> {
    const { logos } = await api.getLocalisedImages(
      tmdbIndexerData.id,
      language,
    );

    const { language: iso_639_1 } = new Intl.Locale(language);

    // Language-neutral logos (no iso_639_1) are kept, as they are usable in any locale
    const candidates = logos.flatMap<MovieImage>((logo) =>
      logo.file_path && (!logo.iso_639_1 || logo.iso_639_1 === iso_639_1)
        ? {
            file_path: logo.file_path,
            width: logo.width,
            aspect_ratio: logo.aspect_ratio,
            vote_average: logo.vote_average,
            vote_count: logo.vote_count,
            height: logo.height,
            iso_639_1: logo.iso_639_1 ?? null,
          }
        : [],
    );

    if (candidates.length === 0) {
      return null;
    }

    if (width === null && aspectRatio === null) {
      const [highestRatedLogo] = candidates.toSorted(byRating);

      if (!highestRatedLogo?.file_path) {
        return null;
      }

      const imageUrl = formatImageUrl(
        highestRatedLogo.file_path,
        "logo",
        "original",
      );

      if (!imageUrl) {
        return null;
      }

      return {
        url: imageUrl,
        height: highestRatedLogo.height,
        width: highestRatedLogo.width,
        aspectRatio: highestRatedLogo.aspect_ratio,
      };
    }

    // Prefer logos that are at least as wide as requested to avoid upscaling,
    // falling back to all candidates if none are large enough
    const largeEnoughLogos =
      width === null
        ? candidates
        : candidates.filter((logo) => logo.width >= width);

    const sizedCandidates =
      largeEnoughLogos.length > 0 ? largeEnoughLogos : candidates;

    const [closestLogo] = sizedCandidates.toSorted((a, b) => {
      if (aspectRatio !== null) {
        const aspectRatioDelta =
          Math.abs(a.aspect_ratio - aspectRatio) -
          Math.abs(b.aspect_ratio - aspectRatio);

        if (aspectRatioDelta !== 0) {
          return aspectRatioDelta;
        }
      }

      if (width !== null) {
        const widthDelta =
          Math.abs(a.width - width) - Math.abs(b.width - width);

        if (widthDelta !== 0) {
          return widthDelta;
        }
      }

      return byRating(a, b);
    });

    if (!closestLogo?.file_path) {
      return null;
    }

    const imageUrl = formatImageUrl(closestLogo.file_path, "logo", "original");

    if (!imageUrl) {
      return null;
    }

    return {
      url: imageUrl,
      height: closestLogo.height,
      width: closestLogo.width,
      aspectRatio: closestLogo.aspect_ratio,
    };
  }
}

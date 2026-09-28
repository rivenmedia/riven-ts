import { PluginDataSource } from "@repo/util-plugin-sdk";
import { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";

import { Arg, FieldResolver, Resolver, Root } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import { TmdbIndexerData } from "./types/tmdb-indexer-data.type.ts";

import type { ResolverInterface } from "type-graphql";

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
}

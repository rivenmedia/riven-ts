import { PluginDataSource } from "@repo/util-plugin-sdk";
import { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";
import { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";
import { ItemImage } from "@repo/util-plugin-sdk/dto/types/item-image.type";
import { Trailer } from "@repo/util-plugin-sdk/dto/types/trailer.type";

import { Arg, FieldResolver, Float, Int, Resolver, Root } from "type-graphql";

import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { pluginConfig } from "../tmdb-plugin.config.ts";
import { resolveGenres } from "../utilities/resolve-genres.ts";
import { selectLogo } from "../utilities/select-logo.ts";
import { selectTrailer } from "../utilities/select-trailer.ts";
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
    return resolveGenres(api, tmdbIndexerData, locale);
  }

  @FieldResolver(() => String, { nullable: true })
  public async certification(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @Arg("locale", { defaultValue: "en-US" }) locale: string,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<string | null> {
    return tmdbIndexerData.adapter.getCertification(
      api,
      tmdbIndexerData,
      locale,
    );
  }

  @FieldResolver(() => String, { nullable: true })
  public async imdbId(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<string | null> {
    return tmdbIndexerData.adapter.getImdbId(api, tmdbIndexerData);
  }

  @FieldResolver(() => Trailer, { nullable: true })
  public async trailer(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
    @Arg("language", () => String, { nullable: true, defaultValue: "en-US" })
    language: string,
  ): Promise<Trailer | null> {
    const { results: videos } = await api.getLocalisedVideos(
      tmdbIndexerData.adapter.mediaType,
      tmdbIndexerData.tmdbId,
      language,
    );

    return selectTrailer(videos, language);
  }

  @FieldResolver(() => [TmdbIndexerData], { nullable: true })
  public async recommendations(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData[] | null> {
    return tmdbIndexerData.adapter.getRecommendations(api, tmdbIndexerData);
  }

  @FieldResolver(() => [TmdbIndexerData], { nullable: true })
  public async similarItems(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
  ): Promise<TmdbIndexerData[] | null> {
    return tmdbIndexerData.adapter.getSimilarItems(api, tmdbIndexerData);
  }

  @FieldResolver(() => [CastMember], { nullable: true })
  public async cast(
    @Root() tmdbIndexerData: TmdbIndexerData,
    @PluginDataSource(pluginConfig.name, TmdbAPI) api: TmdbAPI,
    @Arg("language", () => String, { defaultValue: "en-US" }) language: string,
  ): Promise<CastMember[] | null> {
    return tmdbIndexerData.adapter.getCast(api, tmdbIndexerData, language);
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
      tmdbIndexerData.adapter.mediaType,
      tmdbIndexerData.tmdbId,
      language,
    );

    return selectLogo(logos, { width, aspectRatio, language });
  }
}

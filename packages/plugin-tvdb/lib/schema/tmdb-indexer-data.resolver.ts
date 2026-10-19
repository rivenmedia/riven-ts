import { PluginDataSource } from "@repo/util-plugin-sdk";
import { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

import {
  FieldResolver,
  Resolver,
  Root,
  getMetadataStorage,
} from "type-graphql";

import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

@Resolver(() => {
  const tmdbIndexerData = getMetadataStorage().objectTypes.find(
    (type) => type.name === "TmdbIndexerData",
  );

  if (!tmdbIndexerData) {
    throw new Error("TmdbIndexerData type not found in metadata storage");
  }

  return tmdbIndexerData.target;
})
export class TvdbTmdbIndexerDataResolver {
  @FieldResolver(() => [IndexerSeason], { nullable: true })
  public async seasons(
    @Root() tmdbIndexerData: IndexerData,
    @PluginDataSource(pluginConfig.name, TvdbAPI) api: TvdbAPI,
  ): Promise<IndexerSeason[] | null> {
    if (tmdbIndexerData.type !== "show") {
      return null;
    }

    const episodes = await api.getAllEpisodesInOfficialOrder(
      tmdbIndexerData.id,
    );

    const seasons = new Map<number, IndexerSeason>();

    for (const episode of episodes) {
      if (
        !episode.seasonNumber ||
        typeof episode.number !== "number" ||
        typeof episode.absoluteNumber !== "number" ||
        !episode.seriesId
      ) {
        continue;
      }

      if (!seasons.has(episode.seasonNumber)) {
        seasons.set(episode.seasonNumber, {
          showId: episode.seriesId.toString(),
          number: episode.seasonNumber,
          id:
            episode.seasons
              ?.find((season) => season.number === episode.seasonNumber)
              ?.id?.toString() ?? `season-${episode.seasonNumber.toString()}`,
          title:
            episode.seasonName ?? `Season ${episode.seasonNumber.toString()}`,
          episodes: [],
        });
      }

      seasons.get(episode.seasonNumber)?.episodes.push({
        id: episode.id?.toString() ?? `episode-${episode.number.toString()}`,
        title: episode.name ?? `Episode ${episode.number.toString()}`,
        number: episode.number,
        posterUrl: episode.image ?? null,
      });
    }

    return seasons.values().toArray();
  }
}

import { DateTime } from "luxon";
import assert from "node:assert";

import { EpisodeFactory } from "../../factories/episode.factory.ts";
import { SeasonFactory } from "../../factories/season.factory.ts";
import { ShowFactory } from "../../factories/show.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

export interface IndexedShowSeederContext {
  show: Show;
  seasons?: Season[];
  episodes?: Episode[];
}

export class IndexedShowSeeder extends BaseSeeder<IndexedShowSeederContext> {
  #episodesPerSeason = 10;
  #seasonCount = 6;

  public async run(
    em: EntityManager,
    context: IndexedShowSeederContext = this.context,
  ) {
    const releaseDate = DateTime.utc().minus({ years: 1 }).toISO();
    const indexedAt = DateTime.utc().toJSDate();

    context.show = await new ShowFactory(em).createOne({
      releaseDate: null, // Allow the subscriber to set the release date based on the first episode's release date
      indexedAt,
    });

    let absoluteEpisodeNumber = 1;

    for (
      let seasonNumber = 1;
      seasonNumber <= this.#seasonCount;
      seasonNumber += 1
    ) {
      const season = await new SeasonFactory(em).createOne({
        tvdbId: context.show.tvdbId,
        number: seasonNumber,
        releaseDate: null, // Allow the subscriber to set the release date based on the first episode's release date
        show: context.show,
        itemRequest: context.show.itemRequest,
        indexedAt,
      });

      context.seasons ??= [];
      context.seasons.push(season);

      for (
        let episodeNumber = 1;
        episodeNumber <= this.#episodesPerSeason;
        episodeNumber += 1
      ) {
        season.episodes.add(
          new EpisodeFactory(em).makeEntity({
            tvdbId: context.show.tvdbId,
            number: episodeNumber,
            absoluteNumber: absoluteEpisodeNumber,
            releaseDate,
            itemRequest: context.show.itemRequest,
            indexedAt,
          }),
        );

        absoluteEpisodeNumber += 1;
      }

      context.episodes ??= [];
      context.episodes.push(...season.episodes);
    }

    await em.flush();

    assert.ok(
      context.show.state === "indexed",
      `Expected show state to be "indexed", got "${context.show.state}"`,
    );
  }
}

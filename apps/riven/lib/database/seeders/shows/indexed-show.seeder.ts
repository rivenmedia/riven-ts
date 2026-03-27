import { DateTime } from "luxon";
import assert from "node:assert";

import { EpisodeFactory } from "../../factories/episode.factory.ts";
import { SeasonFactory } from "../../factories/season.factory.ts";
import { ShowFactory } from "../../factories/show.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

export interface IndexedShowSeederContext {
  show: Show;
}

export class IndexedShowSeeder extends BaseSeeder<IndexedShowSeederContext> {
  #episodesPerSeason = 10;
  #seasonCount = 6;

  async run(
    em: EntityManager,
    context: IndexedShowSeederContext = this.context,
  ) {
    const releaseDate = DateTime.now().minus({ years: 1 }).toISO();

    context.show = await new ShowFactory(em).createOne({
      releaseDate,
    });

    let absoluteEpisodeNumber = 1;

    for (
      let seasonNumber = 1;
      seasonNumber <= this.#seasonCount;
      seasonNumber++
    ) {
      const season = await new SeasonFactory(em).createOne({
        tvdbId: context.show.tvdbId,
        number: seasonNumber,
        releaseDate,
        show: context.show,
        itemRequest: context.show.itemRequest,
      });

      for (
        let episodeNumber = 1;
        episodeNumber <= this.#episodesPerSeason;
        episodeNumber++
      ) {
        await new EpisodeFactory(em).createOne({
          tvdbId: context.show.tvdbId,
          number: episodeNumber,
          absoluteNumber: absoluteEpisodeNumber++,
          releaseDate,
          season,
          itemRequest: context.show.itemRequest,
        });
      }
    }

    await em.flush();

    assert(
      context.show.state === "indexed",
      `Expected show state to be "indexed", got "${context.show.state}"`,
    );
  }
}

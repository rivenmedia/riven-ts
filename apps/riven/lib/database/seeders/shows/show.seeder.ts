import { DateTime } from "luxon";

import { EpisodeFactory } from "../../factories/episode.factory.ts";
import { ItemRequestFactory } from "../../factories/item-request.factory.ts";
import { SeasonFactory } from "../../factories/season.factory.ts";
import { ShowFactory } from "../../factories/show.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

export interface ShowSeederContext {
  showData?: EntityData<Show>;
  seasonCount?: number;
  episodesPerSeason?: number;
}

export class IndexedShowSeeder extends BaseSeeder<ShowSeederContext> {
  #episodesPerSeason = 10;
  #seasonCount = 6;

  async run(
    em: EntityManager,
    {
      episodesPerSeason = this.#episodesPerSeason,
      seasonCount = this.#seasonCount,
      ...context
    } = this.context ?? {},
  ) {
    const itemRequest = await new ItemRequestFactory(em).createOne({
      state: "completed",
      type: "show",
    });

    const releaseDate = DateTime.now().minus({ years: 1 }).toISO();

    const show = await new ShowFactory(em).createOne({
      itemRequest,
      releaseDate,
      ...context.showData,
    });

    let absoluteEpisodeNumber = 1;

    for (let seasonNumber = 1; seasonNumber <= seasonCount; seasonNumber++) {
      const season = await new SeasonFactory(em).createOne({
        tvdbId: show.tvdbId,
        number: seasonNumber,
        itemRequest,
        releaseDate,
        show,
      });

      for (
        let episodeNumber = 1;
        episodeNumber <= episodesPerSeason;
        episodeNumber++
      ) {
        await new EpisodeFactory(em).createOne({
          tvdbId: show.tvdbId,
          number: episodeNumber,
          absoluteNumber: absoluteEpisodeNumber++,
          itemRequest,
          releaseDate,
          season,
        });
      }
    }
  }
}

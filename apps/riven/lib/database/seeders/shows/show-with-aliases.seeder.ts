import { Seeder } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { EpisodeFactory } from "../../factories/episode.factory.ts";
import { ItemRequestFactory } from "../../factories/item-request.factory.ts";
import { SeasonFactory } from "../../factories/season.factory.ts";
import { ShowFactory } from "../../factories/show.factory.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ShowWithAliasesSeeder extends Seeder {
  async run(em: EntityManager) {
    const itemRequest = await new ItemRequestFactory(em).createOne({
      state: "completed",
      type: "show",
    });

    const releaseDate = DateTime.now().minus({ years: 1 }).toISO();

    const show = await new ShowFactory(em).createOne({
      title: "Foreign Show",
      itemRequest,
      status: "ended",
      aliases: {
        es: ["Película Extranjera"],
        fr: ["Show Étranger"],
        jp: ["外国映画"],
      },
      isRequested: true,
      releaseDate,
    });

    let absoluteEpisodeNumber = 1;

    for (let seasonNumber = 1; seasonNumber <= 6; seasonNumber++) {
      const season = await new SeasonFactory(em).createOne({
        tvdbId: show.tvdbId,
        number: seasonNumber,
        itemRequest,
        releaseDate,
        show,
      });

      for (let episodeNumber = 1; episodeNumber <= 10; episodeNumber++) {
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

import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { SeasonFactory } from "./season.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class EpisodeFactory extends Factory<Episode> {
  model = Episode;

  protected override definition(
    input: EntityData<Episode> = {},
  ): EntityData<Episode> {
    const season = input.season ?? new SeasonFactory(this.em).makeEntity();
    const number = faker.number.int({ min: 1 });

    return {
      title: faker.book.title(),
      number,
      absoluteNumber: number,
      posterPath: faker.image.url(),
      isRequested: true,
      tvdbId: faker.number.int({ min: 1 }).toString(),
      contentRating: "tv_14",
      releaseDate: faker.date.between({
        from: DateTime.now().minus({ years: 1 }).toISO(),
        to: DateTime.now().plus({ years: 1 }).toISO(),
      }),
      season,
      ...input,
    };
  }
}

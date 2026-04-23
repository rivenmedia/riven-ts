import { Season } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { ShowFactory } from "./show.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class SeasonFactory extends Factory<Season> {
  model = Season;

  protected override definition(
    input: EntityData<Season> = {},
  ): EntityData<Season> {
    const show = input.show ?? new ShowFactory(this.em).makeEntity();

    return {
      title: faker.book.title(),
      number: faker.number.int({ min: 1 }),
      posterPath: faker.image.url(),
      isRequested: true,
      tvdbId: faker.number.int({ min: 1 }).toString(),
      releaseDate: faker.date.between({
        from: DateTime.utc().minus({ years: 1 }).toISO(),
        to: DateTime.utc().plus({ years: 1 }).toISO(),
      }),
      show,
      ...input,
    };
  }
}

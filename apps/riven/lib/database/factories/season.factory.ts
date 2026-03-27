import { Season } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import type { EntityData } from "@mikro-orm/core";

export class SeasonFactory extends Factory<Season> {
  model = Season;

  protected override definition(
    input: EntityData<Season> = {},
  ): EntityData<Season> {
    return {
      title: faker.book.title(),
      number: faker.number.int({ min: 1 }),
      posterPath: faker.image.url(),
      isRequested: true,
      itemRequest: 1,
      tvdbId: faker.number.int({ min: 1 }).toString(),
      releaseDate: faker.date.between({
        from: DateTime.now().minus({ years: 1 }).toISO(),
        to: DateTime.now().plus({ years: 1 }).toISO(),
      }),
      ...input,
    };
  }
}

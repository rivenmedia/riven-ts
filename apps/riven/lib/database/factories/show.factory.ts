import { Show } from "@repo/util-plugin-sdk/dto/entities";
import { ShowContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { ShowItemRequestFactory } from "./show-item-request.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class ShowFactory extends Factory<Show> {
  public model = Show;

  protected override definition(
    input: EntityData<Show> = {},
  ): EntityData<Show> {
    const itemRequest =
      input.itemRequest ?? new ShowItemRequestFactory(this.em).makeEntity();

    return {
      title: faker.book.title(),
      posterPath: faker.image.url(),
      contentRating: faker.helpers.arrayElement(ShowContentRating.options),
      isRequested: true,
      itemRequest,
      tvdbId: faker.string.numeric({ length: { min: 1, max: 10 } }),
      status: "ended",
      releaseDate: faker.date.between({
        from: DateTime.utc().minus({ years: 1 }).toISO(),
        to: DateTime.utc().plus({ years: 1 }).toISO(),
      }),
      ...input,
    };
  }
}

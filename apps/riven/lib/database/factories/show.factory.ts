import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { ItemRequestFactory } from "./item-request.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class ShowFactory extends Factory<Show> {
  model = Show;

  protected override definition(
    input: EntityData<Show> = {},
  ): EntityData<Show> {
    const itemRequest =
      input.itemRequest ??
      new ItemRequestFactory(this.em).makeEntity({ type: "show" });

    return {
      title: faker.book.title(),
      posterPath: faker.image.url(),
      contentRating: "tv-14",
      isRequested: true,
      itemRequest,
      tvdbId: faker.number.int({ min: 1 }).toString(),
      status: "ended",
      releaseDate: faker.date.between({
        from: DateTime.now().minus({ years: 1 }).toISO(),
        to: DateTime.now().plus({ years: 1 }).toISO(),
      }),
      ...input,
    };
  }
}

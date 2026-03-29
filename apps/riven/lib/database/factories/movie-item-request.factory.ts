import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class MovieItemRequestFactory extends Factory<ItemRequest> {
  model = ItemRequest;

  protected override definition(
    input: EntityData<ItemRequest> = {},
  ): EntityData<ItemRequest> {
    return {
      requestedBy: faker.internet.email(),
      state: "completed",
      type: "movie",
      tmdbId: faker.number.int({ min: 1 }).toString(),
      ...input,
    };
  }
}

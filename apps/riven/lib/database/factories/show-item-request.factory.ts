import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class ShowItemRequestFactory extends Factory<ItemRequest> {
  public model = ItemRequest;

  protected override definition(
    input: EntityData<ItemRequest> = {},
  ): EntityData<ItemRequest> {
    return {
      requestedBy: faker.internet.email(),
      state: "requested",
      type: "show",
      tvdbId: faker.string.numeric({ length: 10 }),
      ...input,
    };
  }
}

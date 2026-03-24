import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { toMerged } from "es-toolkit";

import type { EntityData, RequiredEntityData } from "@mikro-orm/core";

export class ItemRequestFactory extends Factory<ItemRequest> {
  model = ItemRequest;

  protected override definition(
    input: EntityData<ItemRequest> = {},
  ): EntityData<ItemRequest> {
    return toMerged<RequiredEntityData<ItemRequest>, EntityData<ItemRequest>>(
      {
        requestedBy: faker.internet.email(),
        state: "completed",
        type: "movie",
      },
      input,
    );
  }
}

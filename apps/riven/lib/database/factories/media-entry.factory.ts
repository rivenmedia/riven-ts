import { MediaEntry } from "@rivenmedia/plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class MediaEntryFactory extends Factory<MediaEntry> {
  model = MediaEntry;

  protected override definition(
    input: EntityData<MediaEntry> = {},
  ): EntityData<MediaEntry> {
    return {
      fileSize: faker.number.int({ min: 1024 * 1024 }),
      originalFilename: faker.system.fileName(),
      plugin: faker.lorem.word(),
      ...input,
    };
  }
}

import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { toMerged } from "es-toolkit";

import type { EntityData, RequiredEntityData } from "@mikro-orm/core";

export class MediaEntryFactory extends Factory<MediaEntry> {
  model = MediaEntry;

  protected override definition(
    input: EntityData<MediaEntry> = {},
  ): EntityData<MediaEntry> {
    return toMerged<RequiredEntityData<MediaEntry>, EntityData<MediaEntry>>(
      {
        fileSize: faker.number.int({ min: 1024 * 1024 }),
        originalFilename: faker.system.fileName(),
        plugin: faker.lorem.word(),
      },
      input,
    );
  }
}

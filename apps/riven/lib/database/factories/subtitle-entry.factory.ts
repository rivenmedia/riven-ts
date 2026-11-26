import { SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class SubtitleEntryFactory extends Factory<SubtitleEntry> {
  public model = SubtitleEntry;

  protected override definition(
    input: EntityData<SubtitleEntry> = {},
  ): EntityData<SubtitleEntry> {
    return {
      fileSize: faker.number.int({ min: 1024 * 1024 }),
      content: faker.lorem.paragraph(),
      fileHash: faker.string.hexadecimal({ length: 16 }),
      sourceProvider: faker.lorem.word(),
      language: faker.location.language().alpha2,
      ...input,
    };
  }
}

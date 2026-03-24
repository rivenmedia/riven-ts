import { Stream } from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { toMerged } from "es-toolkit";

import type { EntityData, RequiredEntityData } from "@mikro-orm/core";

export class StreamFactory extends Factory<Stream> {
  model = Stream;

  protected override definition(
    input: EntityData<Stream> = {},
  ): EntityData<Stream> {
    return toMerged<RequiredEntityData<Stream>, EntityData<Stream>>(
      {
        infoHash: faker.git.commitSha(),
        parsedData: parse("Example.Movie.2024.1080p.BluRay.x264-GROUP"),
      },
      input,
    );
  }
}

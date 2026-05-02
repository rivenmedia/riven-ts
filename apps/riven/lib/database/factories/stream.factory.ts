import { parse } from "@repo/util-rank-torrent-name/parser";

import { Stream } from "@rivenmedia/plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class StreamFactory extends Factory<Stream> {
  model = Stream;

  protected override definition(
    input: EntityData<Stream> = {},
  ): EntityData<Stream> {
    return {
      infoHash: faker.git.commitSha(),
      parsedData: parse("Example.Movie.2024.1080p.BluRay.x264-GROUP"),
      ...input,
    };
  }
}

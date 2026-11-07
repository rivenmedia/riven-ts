import { StreamFactory } from "#database/factories/stream.factory.ts";
import { BaseSeeder } from "#database/seeders/base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Stream } from "@repo/util-plugin-sdk/dto/entities";

export interface StreamsSeederContext {
  streams: Stream[];
}

export class StreamsSeeder extends BaseSeeder<StreamsSeederContext> {
  public async run(
    em: EntityManager,
    context: StreamsSeederContext = this.context,
  ) {
    context.streams = await new StreamFactory(em).create(10);
  }
}

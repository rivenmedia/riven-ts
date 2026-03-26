import { StreamFactory } from "../../factories/stream.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { Stream } from "@repo/util-plugin-sdk/dto/entities";

export class StreamsSeeder extends BaseSeeder<EntityData<Stream>> {
  run(em: EntityManager) {
    new StreamFactory(em).make(10);
  }
}

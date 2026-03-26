import { Seeder } from "@mikro-orm/seeder";

import { StreamFactory } from "../../factories/stream.factory.ts";

import type { EntityManager } from "@mikro-orm/core";

export class StreamsSeeder extends Seeder {
  run(em: EntityManager) {
    new StreamFactory(em).make(10);
  }
}

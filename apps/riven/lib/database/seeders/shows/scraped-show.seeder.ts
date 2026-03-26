import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";

import { Seeder } from "@mikro-orm/seeder";

import { StreamsSeeder } from "../streams/streams.seeder.ts";
import { ShowSeeder } from "./show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ScrapedShowSeeder extends Seeder {
  async run(em: EntityManager) {
    await this.call(em, [ShowSeeder, StreamsSeeder]);

    const show = await em.findOneOrFail(MediaItem, {
      type: "show",
    });

    show.streams.set(await em.findAll(Stream));
  }
}

import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";

import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import { StreamsSeeder } from "../streams/streams.seeder.ts";
import { IndexedShowSeeder, type ShowSeederContext } from "./show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ScrapedShowSeeder extends BaseSeeder<ShowSeederContext> {
  async run(em: EntityManager) {
    await this.call(em, [IndexedShowSeeder, StreamsSeeder]);

    const show = await em.findOneOrFail(
      MediaItem,
      { type: "show" },
      { orderBy: { createdAt: "desc" } },
    );

    show.streams.set(await em.findAll(Stream));

    await em.flush();

    assert(
      show.state === "scraped",
      `Expected show state to be "scraped", got "${show.state}"`,
    );
  }
}

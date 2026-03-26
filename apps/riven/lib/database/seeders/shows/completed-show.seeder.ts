import { Show, Stream } from "@repo/util-plugin-sdk/dto/entities";

import { Seeder } from "@mikro-orm/seeder";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { ScrapedShowSeeder } from "./scraped-show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class CompletedShowSeeder extends Seeder {
  async run(em: EntityManager) {
    await this.call(em, [ScrapedShowSeeder]);

    const show = await em.findOneOrFail(
      Show,
      { type: "show" },
      { orderBy: { createdAt: "desc" } },
    );

    show.streams.set(await em.findAll(Stream));

    const episodes = await show.getEpisodes();

    for (const episode of episodes) {
      episode.filesystemEntries.set([
        new MediaEntryFactory(em).makeOne({
          mediaItem: episode,
        }),
      ]);
    }

    await em.flush();

    assert(
      show.state === "completed",
      `Expected show state to be "completed", got "${show.state}"`,
    );
  }
}

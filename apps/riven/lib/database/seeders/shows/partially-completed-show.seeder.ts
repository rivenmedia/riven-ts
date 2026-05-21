import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import {
  ScrapedShowSeeder,
  type ScrapedShowSeederContext,
} from "./scraped-show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export type PartiallyCompletedShowSeederContext = ScrapedShowSeederContext;

export class PartiallyCompletedShowSeeder extends BaseSeeder<PartiallyCompletedShowSeederContext> {
  async run(
    em: EntityManager,
    context: PartiallyCompletedShowSeederContext = this.context,
  ) {
    await this.call(em, [ScrapedShowSeeder], context);

    const episodes = await context.show.getEpisodes();

    for (const episode of episodes) {
      em.persist(episode);

      episode.filesystemEntries.set([
        new MediaEntryFactory(em).makeEntity({
          mediaItem: episode,
        }),
      ]);
    }

    episodes[0]?.filesystemEntries.removeAll();

    await em.flush();

    assert(
      context.show.state === "partially_completed",
      `Expected show state to be "partially_completed", got "${context.show.state}"`,
    );
  }
}

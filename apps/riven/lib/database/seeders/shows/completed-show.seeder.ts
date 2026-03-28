import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import {
  ScrapedShowSeeder,
  type ScrapedShowSeederContext,
} from "./scraped-show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export type CompletedShowSeederContext = ScrapedShowSeederContext;

export class CompletedShowSeeder extends BaseSeeder<CompletedShowSeederContext> {
  async run(
    em: EntityManager,
    context: CompletedShowSeederContext = this.context,
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

    await em.flush();

    assert(
      context.show.state === "completed",
      `Expected show state to be "completed", got "${context.show.state}"`,
    );
  }
}

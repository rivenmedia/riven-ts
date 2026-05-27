import { type EntityManager, ref } from "@mikro-orm/core";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import {
  ScrapedShowSeeder,
  type ScrapedShowSeederContext,
} from "./scraped-show.seeder.ts";

export type CompletedShowSeederContext = ScrapedShowSeederContext;

export class CompletedShowSeeder extends BaseSeeder<CompletedShowSeederContext> {
  async run(
    em: EntityManager,
    context: CompletedShowSeederContext = this.context,
  ) {
    await this.call(em, [ScrapedShowSeeder], context);

    assert(
      context.streams[0],
      "Expected at least one stream to be present in context.streams",
    );

    const [activeStream] = context.streams;

    context.show.activeStream = ref(activeStream);

    for (const season of context.show.seasons) {
      season.activeStream = ref(activeStream);
    }

    const episodes = await context.show.getEpisodes();

    const plugin = "test-plugin";
    const provider = "test-provider";

    for (const episode of episodes) {
      em.persist(episode);

      episode.activeStream = ref(activeStream);
      episode.filesystemEntries.set([
        new MediaEntryFactory(em).makeEntity({
          mediaItem: episode,
          plugin,
          provider,
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

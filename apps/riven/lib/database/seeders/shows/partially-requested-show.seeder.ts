import { ref } from "@mikro-orm/core";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import { ScrapedShowSeeder } from "./scraped-show.seeder.ts";

import type { ScrapedShowSeederContext } from "./scraped-show.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";

export type PartiallyRequestedShowSeederContext = ScrapedShowSeederContext;

export class PartiallyRequestedShowSeeder extends BaseSeeder<PartiallyRequestedShowSeederContext> {
  public async run(
    em: EntityManager,
    context: PartiallyRequestedShowSeederContext = this.context,
  ) {
    await this.call(em, [ScrapedShowSeeder], context);

    const itemRequest = await context.show.itemRequest.loadOrFail();

    itemRequest.seasons = [1, 2, 3];
    itemRequest.isPartialRequest = true;

    const unrequestedSeasons = await context.show.seasons.matching({
      where: {
        number: {
          $nin: itemRequest.seasons,
        },
      },
    });

    for (const season of unrequestedSeasons) {
      em.persist(season).assign(season, { isRequested: false });

      for (const episode of season.episodes) {
        em.persist(episode).assign(episode, { isRequested: false });
      }
    }

    await em.flush();

    const requestedEpisodes = await context.show.episodes.matching({
      where: {
        isRequested: true,
      },
    });

    assert.ok(
      requestedEpisodes.length === 30,
      `Expected 30 requested episodes, got ${requestedEpisodes.length.toString()}`,
    );

    for (const episode of requestedEpisodes) {
      em.persist(episode);

      episode.filesystemEntries.add(
        new MediaEntryFactory(em).makeOne({
          mediaItem: ref(episode),
        }),
      );
    }

    await em.flush();

    assert.ok(
      itemRequest.state === "completed",
      `Expected item request state to be "completed", got "${itemRequest.state}"`,
    );

    assert.ok(
      context.show.state === "completed",
      `Expected show state to be "completed", got "${context.show.state}"`,
    );
  }
}

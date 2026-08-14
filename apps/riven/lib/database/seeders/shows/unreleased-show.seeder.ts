import { Season } from "@repo/util-plugin-sdk/dto/entities";

import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import { IndexedShowSeeder } from "./indexed-show.seeder.ts";

import type { ScrapedShowSeederContext } from "./scraped-show.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";

export type UnreleasedShowSeederContext = ScrapedShowSeederContext;

export class UnreleasedShowSeeder extends BaseSeeder<UnreleasedShowSeederContext> {
  public async run(
    em: EntityManager,
    context: UnreleasedShowSeederContext = this.context,
  ) {
    await this.call(em, [IndexedShowSeeder], context);

    const [firstSeason, ...seasonsToDelete] = context.show.seasons;

    await em.nativeDelete(Season, {
      number: {
        $in: seasonsToDelete.map(({ number }) => number),
      },
    });

    context.show.status = "upcoming";

    await em.flush();

    assert.ok(
      firstSeason,
      "Expected at least one season to be present in context.show.seasons",
    );

    for (const episode of firstSeason.episodes) {
      episode.releaseDate = null;
    }

    await em.upsert(context.show);

    const itemRequest = await context.show.itemRequest.loadOrFail();

    assert.ok(
      itemRequest.state === "unreleased",
      `Expected item request state to be "unreleased", got "${itemRequest.state}"`,
    );

    assert.ok(
      context.show.state === "unreleased",
      `Expected show state to be "unreleased", got "${context.show.state}"`,
    );
  }
}

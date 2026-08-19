import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import { CompletedShowSeeder } from "./completed-show.seeder.ts";

import type { ScrapedShowSeederContext } from "./scraped-show.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";

export type CompletedOngoingShowSeederContext = ScrapedShowSeederContext;

export class CompletedOngoingShowSeeder extends BaseSeeder<CompletedOngoingShowSeederContext> {
  public async run(
    em: EntityManager,
    context: CompletedOngoingShowSeederContext = this.context,
  ) {
    await this.call(em, [CompletedShowSeeder], context);

    context.show.status = "continuing";

    await em.upsert(context.show);

    const itemRequest = await context.show.itemRequest.loadOrFail();

    assert.ok(
      itemRequest.state === "ongoing",
      `Expected item request state to be "ongoing", got "${itemRequest.state}"`,
    );

    assert.ok(
      context.show.state === "completed",
      `Expected show state to be "completed", got "${context.show.state}"`,
    );
  }
}

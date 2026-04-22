import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import {
  StreamsSeeder,
  type StreamsSeederContext,
} from "../streams/streams.seeder.ts";
import {
  IndexedShowSeeder,
  type IndexedShowSeederContext,
} from "./indexed-show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export interface ScrapedShowSeederContext
  extends IndexedShowSeederContext, StreamsSeederContext {}

export class ScrapedShowSeeder extends BaseSeeder<ScrapedShowSeederContext> {
  async run(
    em: EntityManager,
    context: ScrapedShowSeederContext = this.context,
  ) {
    await this.call(em, [IndexedShowSeeder, StreamsSeeder], context);

    em.persist(context.show);

    context.show.streams.add(context.streams);

    await em.flush();

    assert(
      context.show.state === "scraped",
      `Expected show state to be "scraped", got "${context.show.state}"`,
    );
  }
}

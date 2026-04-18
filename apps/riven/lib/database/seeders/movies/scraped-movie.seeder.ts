import { DateTime } from "luxon";
import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import {
  StreamsSeeder,
  type StreamsSeederContext,
} from "../streams/streams.seeder.ts";
import {
  IndexedMovieSeeder,
  type IndexedMovieSeederContext,
} from "./indexed-movie.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export interface ScrapedMovieSeederContext
  extends IndexedMovieSeederContext, StreamsSeederContext {}

export class ScrapedMovieSeeder extends BaseSeeder<ScrapedMovieSeederContext> {
  async run(
    em: EntityManager,
    context: ScrapedMovieSeederContext = this.context,
  ) {
    await this.call(em, [IndexedMovieSeeder, StreamsSeeder], context);

    em.persist(context.movie);

    em.assign(context.movie, {
      scrapedAt: DateTime.now().toJSDate(),
    });

    context.movie.streams.set(context.streams);

    await em.flush();

    assert(
      context.movie.state === "scraped",
      `Expected movie state to be "scraped", got "${context.movie.state}"`,
    );
  }
}

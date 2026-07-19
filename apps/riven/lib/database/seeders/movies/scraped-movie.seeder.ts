import { DateTime } from "luxon";
import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import { StreamsSeeder } from "../streams/streams.seeder.ts";
import { IndexedMovieSeeder } from "./indexed-movie.seeder.ts";

import type { StreamsSeederContext } from "../streams/streams.seeder.ts";
import type { IndexedMovieSeederContext } from "./indexed-movie.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";

export interface ScrapedMovieSeederContext
  extends IndexedMovieSeederContext, StreamsSeederContext {}

export class ScrapedMovieSeeder extends BaseSeeder<ScrapedMovieSeederContext> {
  public async run(
    em: EntityManager,
    context: ScrapedMovieSeederContext = this.context,
  ) {
    await this.call(em, [IndexedMovieSeeder, StreamsSeeder], context);

    em.persist(context.movie);

    em.assign(context.movie, {
      scrapedAt: DateTime.utc().toJSDate(),
    });

    context.movie.streams.set(context.streams);

    await em.flush();

    assert.ok(
      context.movie.state === "scraped",
      `Expected movie state to be "scraped", got "${context.movie.state}"`,
    );
  }
}

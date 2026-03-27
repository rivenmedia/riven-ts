import {
  MediaItem,
  type Movie,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";

import assert from "node:assert";

import { BaseSeeder } from "../base.seeder.ts";
import { StreamsSeeder } from "../streams/streams.seeder.ts";
import { IndexedMovieSeeder } from "./indexed-movie.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";

export class ScrapedMovieSeeder extends BaseSeeder<EntityData<Movie>> {
  async run(em: EntityManager) {
    await this.call(em, [IndexedMovieSeeder, StreamsSeeder]);

    const movie = await em.findOneOrFail(
      MediaItem,
      { type: "movie" },
      { orderBy: { createdAt: "desc" } },
    );

    movie.streams.set(await em.findAll(Stream));

    await em.flush();

    assert(
      movie.state === "scraped",
      `Expected movie state to be "scraped", got "${movie.state}"`,
    );
  }
}

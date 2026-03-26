import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";

import { Seeder } from "@mikro-orm/seeder";
import assert from "node:assert";

import { StreamsSeeder } from "../streams/streams.seeder.ts";
import { MovieSeeder } from "./movie.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ScrapedMovieSeeder extends Seeder {
  async run(em: EntityManager) {
    await this.call(em, [MovieSeeder, StreamsSeeder]);

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

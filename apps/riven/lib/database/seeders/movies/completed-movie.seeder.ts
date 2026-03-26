import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { type EntityData, type EntityManager, ref } from "@mikro-orm/core";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import { ScrapedMovieSeeder } from "./scraped-movie.seeder.ts";

export class CompletedMovieSeeder extends BaseSeeder<EntityData<Movie>> {
  async run(em: EntityManager) {
    await this.call(em, [ScrapedMovieSeeder]);

    const movie = await em.findOneOrFail(
      Movie,
      { type: "movie" },
      {
        populate: ["streams"],
        orderBy: { createdAt: "desc" },
      },
    );

    assert(movie.streams[0]);

    movie.activeStream = ref(movie.streams[0]);
    movie.filesystemEntries.set([
      new MediaEntryFactory(em).makeEntity({ mediaItem: movie }),
    ]);

    await em.flush();

    assert(
      movie.state === "completed",
      `Expected movie state to be "completed", got "${movie.state}"`,
    );
  }
}

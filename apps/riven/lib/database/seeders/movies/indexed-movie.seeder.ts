import { DateTime } from "luxon";
import assert from "node:assert";

import { MovieFactory } from "../../factories/movie.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export interface IndexedMovieSeederContext {
  movie: Movie;
}

export class IndexedMovieSeeder extends BaseSeeder<IndexedMovieSeederContext> {
  async run(
    em: EntityManager,
    context: IndexedMovieSeederContext = this.context,
  ) {
    context.movie = await new MovieFactory(em).createOne({
      releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
    });

    assert(
      context.movie.state === "indexed",
      `Expected movie state to be "indexed", got "${context.movie.state}"`,
    );
  }
}

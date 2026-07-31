import { DateTime } from "luxon";
import assert from "node:assert";

import { MovieItemRequestFactory } from "../../factories/movie-item-request.factory.ts";
import { MovieFactory } from "../../factories/movie.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export interface IndexedMovieSeederContext {
  movie: Movie;
}

export class IndexedMovieSeeder extends BaseSeeder<IndexedMovieSeederContext> {
  public async run(
    em: EntityManager,
    context: IndexedMovieSeederContext = this.context,
  ) {
    const itemRequest = await new MovieItemRequestFactory(em).createOne();

    context.movie = await new MovieFactory(em).createOne({
      indexedAt: DateTime.utc().toJSDate(),
      releaseDate: DateTime.utc().minus({ years: 1 }).toISO(),
      itemRequest,
    });

    itemRequest.mediaItems.add(context.movie);

    assert.ok(
      context.movie.state === "indexed",
      `Expected movie state to be "indexed", got "${context.movie.state}"`,
    );
  }
}

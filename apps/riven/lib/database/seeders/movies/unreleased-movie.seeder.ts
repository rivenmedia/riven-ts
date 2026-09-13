import { DateTime } from "luxon";
import assert from "node:assert";

import { MovieItemRequestFactory } from "../../factories/movie-item-request.factory.ts";
import { MovieFactory } from "../../factories/movie.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export interface UnreleasedMovieSeederContext {
  movie: Movie;
}

export class UnreleasedMovieSeeder extends BaseSeeder<UnreleasedMovieSeederContext> {
  public async run(
    em: EntityManager,
    context: UnreleasedMovieSeederContext = this.context,
  ) {
    const itemRequest = await new MovieItemRequestFactory(em).createOne();

    context.movie = await new MovieFactory(em).createOne({
      indexedAt: DateTime.utc().toJSDate(),
      releaseDate: DateTime.utc().plus({ years: 1 }).toISO(),
      itemRequest,
    });

    itemRequest.mediaItems.add(context.movie);

    assert.ok(
      itemRequest.state === "unreleased",
      `Expected item request state to be "unreleased", got "${itemRequest.state}"`,
    );

    assert.ok(
      context.movie.state === "unreleased",
      `Expected movie state to be "unreleased", got "${context.movie.state}"`,
    );
  }
}

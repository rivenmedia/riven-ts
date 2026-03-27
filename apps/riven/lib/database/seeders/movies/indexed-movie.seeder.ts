import { DateTime } from "luxon";
import assert from "node:assert";

import { ItemRequestFactory } from "../../factories/item-request.factory.ts";
import { MovieFactory } from "../../factories/movie.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export class IndexedMovieSeeder extends BaseSeeder<EntityData<Movie>> {
  async run(em: EntityManager, context = this.context) {
    const itemRequest = await new ItemRequestFactory(em).createOne({
      state: "completed",
      type: "movie",
    });

    const movie = await new MovieFactory(em).createOne({
      itemRequest,
      releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
      ...context,
    });

    assert(
      movie.state === "indexed",
      `Expected movie state to be "indexed", got "${movie.state}"`,
    );
  }
}

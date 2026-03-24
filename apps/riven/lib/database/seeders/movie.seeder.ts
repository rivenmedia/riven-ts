import { Seeder } from "@mikro-orm/seeder";
import { DateTime } from "luxon";

import { ItemRequestFactory } from "../factories/item-request.factory.ts";
import { MovieFactory } from "../factories/movie.factory.ts";

import type { EntityManager } from "@mikro-orm/core";

export class MovieSeeder extends Seeder {
  async run(em: EntityManager) {
    const itemRequest = await new ItemRequestFactory(em).createOne({
      state: "completed",
      type: "movie",
    });

    await new MovieFactory(em).createOne({
      itemRequest,
      tmdbId: "1",
      releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
    });
  }
}

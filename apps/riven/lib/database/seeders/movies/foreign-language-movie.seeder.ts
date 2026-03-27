import { BaseSeeder } from "../base.seeder.ts";
import {
  IndexedMovieSeeder,
  type IndexedMovieSeederContext,
} from "./indexed-movie.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ForeignLanguageMovieSeeder extends BaseSeeder<IndexedMovieSeederContext> {
  async run(
    em: EntityManager,
    context: IndexedMovieSeederContext = this.context,
  ) {
    await this.call(em, [IndexedMovieSeeder], context);

    em.persist(context.movie);

    em.assign(context.movie, {
      title: "外国映画",
      language: "ja",
      aliases: {
        en: ["Foreign Movie"],
        es: ["Película Extranjera"],
        fr: ["Film Étranger"],
      },
    });
  }
}

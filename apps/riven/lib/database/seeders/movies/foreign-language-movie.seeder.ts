import { BaseSeeder } from "../base.seeder.ts";
import { IndexedMovieSeeder } from "./indexed-movie.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export class ForeignLanguageMovieSeeder extends BaseSeeder<EntityData<Movie>> {
  override context: EntityData<Movie> = {
    title: "外国映画",
    language: "jp",
    aliases: {
      en: ["Foreign Movie"],
      es: ["Película Extranjera"],
      fr: ["Film Étranger"],
    },
  };

  async run(em: EntityManager) {
    await this.call(em, [IndexedMovieSeeder]);
  }
}

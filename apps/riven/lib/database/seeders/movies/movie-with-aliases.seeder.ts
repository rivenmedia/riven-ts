import { BaseSeeder } from "../base.seeder.ts";
import { IndexedMovieSeeder } from "./movie.seeder.ts";

import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { Movie } from "@repo/util-plugin-sdk/dto/entities";

export class MovieWithAliasesSeeder extends BaseSeeder<EntityData<Movie>> {
  override context: EntityData<Movie> = {
    title: "Foreign Movie",
    aliases: {
      es: ["Película Extranjera"],
      fr: ["Film Étranger"],
      jp: ["外国映画"],
    },
  };

  async run(em: EntityManager) {
    await this.call(em, [IndexedMovieSeeder]);
  }
}

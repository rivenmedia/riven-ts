import { Seeder } from "@mikro-orm/seeder";

import { MovieSeeder } from "./movie.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class MovieWithAliasesSeeder extends Seeder {
  async run(em: EntityManager) {
    await new MovieSeeder().run(em, {
      title: "Foreign Movie",
      aliases: {
        es: ["Película Extranjera"],
        fr: ["Film Étranger"],
        jp: ["外国映画"],
      },
    });
  }
}

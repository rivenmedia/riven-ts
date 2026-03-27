import { assert } from "vitest";

import { CompletedMovieSeeder } from "../../database/seeders/movies/completed-movie.seeder.ts";
import { ForeignLanguageMovieSeeder } from "../../database/seeders/movies/foreign-language-movie.seeder.ts";
import { IndexedMovieSeeder } from "../../database/seeders/movies/indexed-movie.seeder.ts";
import { ScrapedMovieSeeder } from "../../database/seeders/movies/scraped-movie.seeder.ts";
import { CompletedShowSeeder } from "../../database/seeders/shows/completed-show.seeder.ts";
import { ForeignLanguageShowSeeder } from "../../database/seeders/shows/foreign-language-show.seeder.ts";
import { IndexedShowSeeder } from "../../database/seeders/shows/indexed-show.seeder.ts";
import { ScrapedShowSeeder } from "../../database/seeders/shows/scraped-show.seeder.ts";

import type { BaseSeeder } from "../../database/seeders/base.seeder.ts";
import type {
  Constructor,
  Dictionary,
  EntityManager,
  MikroORM,
} from "@mikro-orm/core";

type SeederResult<T extends Dictionary, C extends number> = C extends 0
  ? never
  : C extends 1
    ? T
    : [T, ...T[]];

const buildSeederFunction =
  <S extends Dictionary>(
    em: EntityManager,
    SeederClass: Constructor<BaseSeeder<S>>,
  ) =>
  async <C extends number = 1>(
    count: C = 1 as C,
  ): Promise<SeederResult<S, C>> => {
    if (count < 1) {
      throw new Error("Cannot seed a non-positive number of entities");
    }

    const results: S[] = [];

    for (let i = 0; i < count; i++) {
      const seeder = new SeederClass();

      await seeder.run(em, seeder.context);
      await em.flush();

      results.push(seeder.context);

      em.clear();
    }

    if (count === 1) {
      assert(results.length === 1, "Expected exactly one result");

      return results[0] as SeederResult<S, C>;
    }

    return results as SeederResult<S, C>;
  };

export const buildSeederFunctions = (orm: MikroORM, em: EntityManager) => {
  return {
    // Movies
    seedIndexedMovie: buildSeederFunction(em, IndexedMovieSeeder),
    seedScrapedMovie: buildSeederFunction(em, ScrapedMovieSeeder),
    seedCompletedMovie: buildSeederFunction(em, CompletedMovieSeeder),
    seedForeignLanguageMovie: buildSeederFunction(
      em,
      ForeignLanguageMovieSeeder,
    ),

    // Shows
    seedIndexedShow: buildSeederFunction(em, IndexedShowSeeder),
    seedScrapedShow: buildSeederFunction(em, ScrapedShowSeeder),
    seedCompletedShow: buildSeederFunction(em, CompletedShowSeeder),
    seedForeignLanguageShow: buildSeederFunction(em, ForeignLanguageShowSeeder),
  };
};

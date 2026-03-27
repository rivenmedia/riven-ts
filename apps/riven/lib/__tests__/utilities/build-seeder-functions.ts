import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { assert } from "vitest";

import { database } from "../../database/database.ts";
import { CompletedMovieSeeder } from "../../database/seeders/movies/completed-movie.seeder.ts";
import { MovieWithAliasesSeeder } from "../../database/seeders/movies/movie-with-aliases.seeder.ts";
import { IndexedMovieSeeder } from "../../database/seeders/movies/movie.seeder.ts";
import { ScrapedMovieSeeder } from "../../database/seeders/movies/scraped-movie.seeder.ts";
import { CompletedShowSeeder } from "../../database/seeders/shows/completed-show.seeder.ts";
import { ScrapedShowSeeder } from "../../database/seeders/shows/scraped-show.seeder.ts";
import { IndexedShowSeeder } from "../../database/seeders/shows/show.seeder.ts";

import type { BaseSeeder } from "../../database/seeders/base.seeder.ts";
import type {
  Constructor,
  Dictionary,
  EntityManager,
  EntityName,
  FindAllOptions,
} from "@mikro-orm/core";

type SeederResult<T, C extends number> = C extends 0
  ? never
  : C extends 1
    ? T
    : [T, ...T[]];

const buildSeederFunction =
  <T extends object, S extends Dictionary>(
    em: EntityManager,
    entity: EntityName<T>,
    seeder: Constructor<BaseSeeder<S>>,
    options?: FindAllOptions<NoInfer<T>>,
  ) =>
  async <C extends number = 1>(
    count: C = 1 as C,
    context?: S,
  ): Promise<SeederResult<T, C>> => {
    if (count < 1) {
      throw new Error("Cannot seed a non-positive number of entities");
    }

    await database.orm.seeder.seed(
      ...Array(count)
        .fill(null)
        .map(() => seeder.bind(null, context)),
    );

    const entities = await em.findAll(entity, {
      ...options,
      last: count,
    });

    assert(entities[0], "Could not find any entities after seeding.");

    if (count === 1) {
      return entities[0] as SeederResult<T, C>;
    }

    return [entities[0], ...entities.slice(1)] as SeederResult<T, C>;
  };

export const buildSeederFunctions = (em: EntityManager) => {
  return {
    seedIndexedMovie: buildSeederFunction(em, Movie, IndexedMovieSeeder),
    seedMovieWithAliases: buildSeederFunction(
      em,
      Movie,
      MovieWithAliasesSeeder,
    ),
    seedScrapedMovie: buildSeederFunction(em, Movie, ScrapedMovieSeeder, {
      where: {
        state: "scraped",
      },
    }),
    seedCompletedMovie: buildSeederFunction(em, Movie, CompletedMovieSeeder, {
      where: {
        state: "completed",
      },
    }),
    seedIndexedShow: buildSeederFunction(em, Show, IndexedShowSeeder),
    seedScrapedShow: buildSeederFunction(em, Show, ScrapedShowSeeder, {
      where: {
        state: "scraped",
      },
    }),
    seedCompletedShow: buildSeederFunction(em, Show, CompletedShowSeeder, {
      where: {
        state: "completed",
      },
    }),
  };
};

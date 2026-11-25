import { journeyFixtures } from "@repo/util-e2e";

import { DateTime } from "luxon";

import { ShowFactory } from "#database/factories/show.factory.ts";
import { CompletedMovieSeeder } from "#database/seeders/movies/completed-movie.seeder.ts";

import { defineE2eScenario } from "./utilities/define-e2e-scenario.ts";

const { movie, show } = journeyFixtures.library;

const toDate = (isoDate: string) => DateTime.fromISO(isoDate).toJSDate();

/** The library holds a completed movie and an indexed show */
export const e2eLibraryScenario = defineE2eScenario({
  scenarioName: "e2e-library",
  async seed(em) {
    // A movie is only completed once it has a stream and a file, which the seeder adds
    const movieSeeder = new CompletedMovieSeeder();

    await movieSeeder.run(em);

    const itemRequest =
      await movieSeeder.context.movie.itemRequest.loadOrFail();

    em.assign(itemRequest, { tmdbId: movie.tmdbId.toString() });
    em.assign(movieSeeder.context.movie, {
      title: movie.title,
      tmdbId: movie.tmdbId.toString(),
      releaseDate: toDate(movie.releaseDate),
      year: movie.year,
      posterPath: movie.posterUrl,
    });

    await new ShowFactory(em).createOne({
      title: show.title,
      tvdbId: show.tvdbId.toString(),
      releaseDate: toDate(show.firstAirDate),
      year: show.year,
      posterPath: show.posterUrl,
      indexedAt: DateTime.utc().toJSDate(),
    });
  },
});

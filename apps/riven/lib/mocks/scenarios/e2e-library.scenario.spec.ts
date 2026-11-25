import { journeyFixtures } from "@repo/util-e2e";
import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import { e2eLibraryScenario } from "./e2e-library.scenario.ts";

const { movie, show } = journeyFixtures.library;

it("seeds the library items", async ({ em, orm }) => {
  await e2eLibraryScenario.seed(em);

  const fork = orm.em.fork();
  const movies = await fork.find(Movie, {});
  const shows = await fork.find(Show, {});

  expect(
    movies.map(({ title, tmdbId, state }) => ({ title, tmdbId, state })),
  ).toStrictEqual([
    {
      title: movie.title,
      tmdbId: movie.tmdbId.toString(),
      state: movie.state,
    },
  ]);
  expect(
    shows.map(({ title, tvdbId, state }) => ({ title, tvdbId, state })),
  ).toStrictEqual([
    { title: show.title, tvdbId: show.tvdbId.toString(), state: show.state },
  ]);
});

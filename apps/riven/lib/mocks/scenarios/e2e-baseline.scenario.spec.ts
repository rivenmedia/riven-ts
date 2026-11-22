import { e2eUsers, journeyFixtures } from "@repo/util-e2e";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { User } from "#database/entities/user.entity.ts";

import { e2eBaselineScenario } from "./e2e-baseline.scenario.ts";

it("seeds an admin, a manager and a regular user", async ({ em, orm }) => {
  await e2eBaselineScenario.seed(em);

  const users = await orm.em.fork().find(User, {});
  const byUsername = new Map(users.map((user) => [user.name, user]));

  expect(byUsername.get(e2eUsers.admin.username)?.role).toBe("admin");
  expect(byUsername.get(e2eUsers.manager.username)?.role).toBe("manager");
  expect(byUsername.get(e2eUsers.user.username)?.role).toBe("user");
});

it("has no environment data, so it can run in test mode", () => {
  expect(e2eBaselineScenario.environmentData).toBeUndefined();
});

it("can seed an empty database more than once", async ({ em, orm }) => {
  await e2eBaselineScenario.seed(em);
  await orm.schema.clear();
  await e2eBaselineScenario.seed(em.fork());

  await expect(orm.em.fork().count(User)).resolves.toBe(3);
});

const {
  nowPlaying,
  trendingMoviesToday,
  trendingMoviesThisWeek,
  trendingShows,
} = journeyFixtures.home;

it.for([
  { path: "movie/now_playing", item: nowPlaying },
  { path: "trending/movie/day", item: trendingMoviesToday },
  { path: "trending/movie/week", item: trendingMoviesThisWeek },
  { path: "trending/tv/day", item: trendingShows.today },
  { path: "trending/tv/week", item: trendingShows.thisWeek },
])(
  "answers TMDB's $path with the home journey's $item.title",
  async ({ path, item }, { server }) => {
    server.use(...e2eBaselineScenario.handlers);

    const response = await fetch(`https://api.themoviedb.org/3/${path}`);
    const { results } = (await response.json()) as {
      results: { id: number; title?: string; name?: string }[];
    };

    expect(
      results.map(({ id, title, name }) => ({ id, title: title ?? name })),
    ).toContainEqual({ id: item.tmdbId, title: item.title });
  },
);

it.for(Object.values(trendingShows))(
  "answers the TVDB ID of $title, which makes it requestable",
  async ({ tmdbId, tvdbId }, { server }) => {
    server.use(...e2eBaselineScenario.handlers);

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId.toString()}/external_ids`,
    );

    await expect(response.json()).resolves.toMatchObject({ tvdb_id: tvdbId });
  },
);

const { movie: libraryMovie } = journeyFixtures.library;

it("answers TMDB's details of the library journey's movie", async ({
  server,
}) => {
  server.use(...e2eBaselineScenario.handlers);

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${libraryMovie.tmdbId.toString()}`,
  );

  await expect(response.json()).resolves.toMatchObject({
    id: libraryMovie.tmdbId,
    title: libraryMovie.title,
  });
});

it.for(["videos", "credits", "recommendations", "similar"])(
  "answers TMDB's movie %s for the library journey's movie",
  async (path, { server }) => {
    server.use(...e2eBaselineScenario.handlers);

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${libraryMovie.tmdbId.toString()}/${path}`,
    );

    expect(response.ok).toBe(true);
  },
);

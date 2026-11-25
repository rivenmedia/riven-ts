import { e2eUsers, journeyFixtures } from "@repo/util-e2e";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { User } from "#database/entities/user.entity.ts";
import { CorePlugins } from "#schemas/core-plugins.schema.ts";

import { e2eBaselineScenario } from "./e2e-baseline.scenario.ts";
import { tmdbDetailsHandlers } from "./utilities/tmdb-details-handlers.ts";
import { tvdbDetailsHandlers } from "./utilities/tvdb-details-handlers.ts";

it("enables every core plugin as a stored setting, so the settings pages can toggle them", async ({
  em,
  services,
}) => {
  await e2eBaselineScenario.seed(em);

  const stored = await services.settingsService.getStoredValues("riven");

  expect(stored["enabledPlugins"]).toStrictEqual(CorePlugins.options);
});

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

const { unrequestedMovie, unrequestedShow, season, episode } =
  journeyFixtures.mediaDetails;

// An ID that no fixture uses
const unknownId = "1";

it("serves the unrequested movie's details", async ({ server }) => {
  server.use(...e2eBaselineScenario.handlers);

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${unrequestedMovie.tmdbId.toString()}`,
  );

  await expect(response.json()).resolves.toMatchObject({
    id: unrequestedMovie.tmdbId,
    title: unrequestedMovie.title,
    overview: unrequestedMovie.overview,
  });
});

it("serves the unrequested show's details from its TVDB ID", async ({
  server,
}) => {
  server.use(...e2eBaselineScenario.handlers);

  const found = await fetch(
    `https://api.themoviedb.org/3/find/${unrequestedShow.tvdbId.toString()}`,
  );

  await expect(found.json()).resolves.toMatchObject({
    tv_results: [{ id: unrequestedShow.tmdbId }],
  });

  const details = await fetch(
    `https://api.themoviedb.org/3/tv/${unrequestedShow.tmdbId.toString()}`,
  );

  await expect(details.json()).resolves.toMatchObject({
    id: unrequestedShow.tmdbId,
    name: unrequestedShow.title,
    overview: unrequestedShow.overview,
  });
});

it("serves the unrequested show's season and episode", async ({ server }) => {
  server.use(...e2eBaselineScenario.handlers);

  const episodes = await fetch(
    `https://api4.thetvdb.com/v4/series/${unrequestedShow.tvdbId.toString()}/episodes/official/eng`,
  );

  await expect(episodes.json()).resolves.toMatchObject({
    data: { episodes: [{ number: episode.number, name: episode.title }] },
  });

  const seasons = await fetch(
    `https://api4.thetvdb.com/v4/series/${unrequestedShow.tvdbId.toString()}/extended`,
  );

  await expect(seasons.json()).resolves.toMatchObject({
    data: { seasons: [{ id: season.tvdbId, name: season.title }] },
  });
});

it.for([
  `https://api.themoviedb.org/3/movie/${unknownId}`,
  `https://api.themoviedb.org/3/movie/${unknownId}/credits`,
  `https://api.themoviedb.org/3/tv/${unknownId}`,
  `https://api.themoviedb.org/3/find/${unknownId}`,
  `https://api4.thetvdb.com/v4/series/${unknownId}/extended`,
])("leaves %s unhandled, as the fixtures don't cover it", async (url) => {
  const results = await Promise.all(
    [...tmdbDetailsHandlers, ...tvdbDetailsHandlers].map((handler) =>
      handler.run({
        request: new Request(url),
        requestId: crypto.randomUUID(),
      }),
    ),
  );

  expect(results.filter((result) => result?.response)).toStrictEqual([]);
});

it.for(["videos", "credits", "recommendations", "similar"])(
  "answers TMDB's movie %s for the unrequested movie",
  async (path, { server }) => {
    server.use(...e2eBaselineScenario.handlers);

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${unrequestedMovie.tmdbId.toString()}/${path}`,
    );

    expect(response.ok).toBe(true);
  },
);

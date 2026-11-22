import { UserRole } from "@repo/util-auth/access-control";
import { e2eUsers } from "@repo/util-e2e";

// oxlint-disable sonarjs/no-clear-text-protocols -- `.invalid` hosts never resolve, and MSW answers these requests in-process
import { RequestContext } from "@mikro-orm/core";
import { HttpResponse, http } from "msw/http";

import { initAuth } from "#auth/auth.ts";
import { database } from "#database/database.ts";
import { MockScenario } from "#mocks/utilities/mock-scenario.ts";

import type { EntityManager } from "@mikro-orm/core";

const tmdbImage = (path: string) => path;

const johnWick = {
  adult: false,
  id: 603_692,
  title: "John Wick: Chapter 4",
  original_title: "John Wick: Chapter 4",
  original_language: "en",
  overview:
    "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
  backdrop_path: tmdbImage("/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg"),
  poster_path: tmdbImage("/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg"),
  genre_ids: [28, 53],
  release_date: "2023-03-24",
  vote_average: 7.8,
  vote_count: 1000,
  popularity: 100,
  video: false,
};

const trendingMovie = {
  day: {
    ...johnWick,
    id: 299_534,
    title: "Avengers: Endgame",
    original_title: "Avengers: Endgame",
    poster_path: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
    release_date: "2019-04-24",
  },
  week: {
    ...johnWick,
    id: 1_368_337,
    title: "The Odyssey",
    original_title: "The Odyssey",
    poster_path: "/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
    release_date: "2026-07-17",
  },
};

const arcane = {
  id: 94_605,
  name: "Arcane",
  overview:
    "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
  backdrop_path: "/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
  poster_path: "/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
  original_language: "en",
  genre_ids: [16, 10_759],
  first_air_date: "2024-11-09",
  origin_country: ["US"],
};

const page = <T>(results: T[]) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

const emptyPage = { page: 1, items: [], count: 0, pages: 1 };

type TimeWindow = keyof typeof trendingMovie;

const isTimeWindow = (value: unknown): value is TimeWindow =>
  value === "day" || value === "week";

class E2eBaselineScenario extends MockScenario {
  public override scenarioName = "e2e-baseline" as const;

  public override handlers = [
    // Plugin validation
    http.get("http://jellyfin.e2e.invalid/System/Configuration", () =>
      HttpResponse.json({}),
    ),
    http.get("http://plex.e2e.invalid/library/sections", () =>
      HttpResponse.json({ MediaContainer: { Directory: [] } }),
    ),
    http.get("http://seerr.e2e.invalid/api/v1/auth/me", () =>
      HttpResponse.json({ id: 1 }),
    ),
    http.get("http://seerr.e2e.invalid/api/v1/settings/metadatas", () =>
      HttpResponse.json({ tv: "tvdb", anime: "tvdb" }),
    ),
    http.get(
      "http://seerr.e2e.invalid/api/v1/settings/notifications/webhook",
      () => HttpResponse.json({ enabled: false }),
    ),
    http.get("http://silo.e2e.invalid/api/v2/scan/capabilities", () =>
      HttpResponse.json({ state: "available", allowed: true }),
    ),
    http.get("http://stremthru.e2e.invalid/v0/store/user", () =>
      HttpResponse.json({
        data: {
          id: "e2e",
          email: "e2e@riven.invalid",
          subscription_status: "premium",
          has_usenet: false,
        },
      }),
    ),
    http.get("http://stremthru.e2e.invalid/v0/torznab/api", () =>
      HttpResponse.json({}),
    ),
    http.get("http://comet.e2e.invalid/validate", () => HttpResponse.json({})),
    http.get("https://torrentio.strem.fun/validate", () =>
      HttpResponse.json({}),
    ),
    http.get("https://api.subdl.com/api/v1/subtitles", () =>
      HttpResponse.json({ status: true, results: [], subtitles: [] }),
    ),
    http.get("https://api.mdblist.com/user", () => HttpResponse.json({})),
    http.get("https://listrr.pro/api/List/My/:page", () =>
      HttpResponse.json(emptyPage),
    ),
    http.post("https://api4.thetvdb.com/v4/login", () =>
      HttpResponse.json({ status: "success", data: { token: "e2e-tvdb" } }),
    ),

    // Content lists, which are all empty
    http.get("http://seerr.e2e.invalid/api/v1/request", () =>
      HttpResponse.json({
        pageInfo: { pages: 1, pageSize: 20, results: 0, page: 1 },
        results: [],
      }),
    ),
    http.get(
      "https://discover.provider.plex.tv/library/sections/watchlist/all",
      () =>
        HttpResponse.json({
          MediaContainer: { size: 0, totalSize: 0, Metadata: [] },
        }),
    ),
    http.get("https://api.mdblist.com/lists/:owner/:name/items", () =>
      HttpResponse.json({ movies: [], shows: [] }),
    ),
    http.get("https://listrr.pro/api/List/:kind/:id/:page", () =>
      HttpResponse.json(emptyPage),
    ),

    // The dashboard's TMDB requests
    http.get("https://api.themoviedb.org/3/movie/now_playing", () =>
      HttpResponse.json(page([johnWick])),
    ),
    http.get(
      "https://api.themoviedb.org/3/trending/movie/:timeWindow",
      ({ params }) =>
        HttpResponse.json(
          page([
            trendingMovie[
              isTimeWindow(params["timeWindow"]) ? params["timeWindow"] : "day"
            ],
          ]),
        ),
    ),
    http.get("https://api.themoviedb.org/3/trending/tv/:timeWindow", () =>
      HttpResponse.json(page([arcane])),
    ),
    http.get("https://api.themoviedb.org/3/tv/:id/external_ids", () =>
      HttpResponse.json({ imdb_id: "tt11126994", tvdb_id: 371_028 }),
    ),
    http.get("https://api.themoviedb.org/3/genre/:mediaType/list", () =>
      HttpResponse.json({
        genres: [
          { id: 28, name: "Action" },
          { id: 53, name: "Thriller" },
          { id: 16, name: "Animation" },
          { id: 10_759, name: "Action & Adventure" },
        ],
      }),
    ),
    http.get("https://api.themoviedb.org/3/movie/:id/release_dates", () =>
      HttpResponse.json({
        id: johnWick.id,
        results: [
          {
            iso_3166_1: "US",
            release_dates: [
              {
                certification: "R",
                iso_639_1: "en",
                type: 3,
                release_date: "",
              },
            ],
          },
        ],
      }),
    ),
    http.get("https://api.themoviedb.org/3/:mediaType/:id/images", () =>
      HttpResponse.json({
        id: johnWick.id,
        backdrops: [],
        posters: [],
        logos: [
          {
            aspect_ratio: 2 / 3,
            height: 600,
            width: 400,
            iso_639_1: "en",
            file_path: "/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
            vote_average: 5,
            vote_count: 10,
          },
        ],
      }),
    ),
  ] as const;

  public override async seed(em: EntityManager) {
    // Boot applies the scenario before the GraphQL server initialises auth
    const auth = initAuth(database.orm);

    await RequestContext.create(em, async () => {
      for (const role of UserRole.options) {
        const { username, password, email } = e2eUsers[role];

        await auth.api.createUser({
          body: {
            name: username,
            email,
            password,
            role,
            data: { username },
          },
        });
      }
    });
  }
}

export const e2eBaselineScenario = new E2eBaselineScenario();

import { UserRole } from "@repo/util-auth/access-control";
import { e2eUsers } from "@repo/util-e2e";

// oxlint-disable sonarjs/no-clear-text-protocols -- `.invalid` hosts never resolve, and MSW answers these requests in-process
import { RequestContext } from "@mikro-orm/core";
import { HttpResponse, http } from "msw/http";

import { initAuth } from "#auth/auth.ts";
import { database } from "#database/database.ts";
import { Setting } from "#database/entities/setting.entity.ts";
import { MockScenario } from "#mocks/utilities/mock-scenario.ts";
import { CorePlugins } from "#schemas/core-plugins.schema.ts";
import { CORE_NAMESPACE } from "#settings/core-settings-sections.ts";

import { tmdbDetailsHandlers } from "./utilities/tmdb-details-handlers.ts";
import { tmdbHomeHandlers } from "./utilities/tmdb-home-handlers.ts";
import { tvdbDetailsHandlers } from "./utilities/tvdb-details-handlers.ts";

import type { EntityManager } from "@mikro-orm/core";

const emptyPage = { page: 1, items: [], count: 0, pages: 1 };

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

    // The home page renders these lists through `"use cache"`, which the one Next.js server shares between tests.
    // Every scenario must serve the same data, or a test sees whichever scenario rendered the home page first.
    ...tmdbHomeHandlers,

    // The details page renders cast, similar items and recommendations through `"use cache"`, which the one Next.js server shares between tests.
    // A TMDB ID must get the same answer in every scenario, so the baseline answers them all.
    ...tmdbDetailsHandlers,
    ...tvdbDetailsHandlers,

    // The details TMDB looks up for any item
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
    http.get(
      "https://api.themoviedb.org/3/movie/:id/release_dates",
      ({ params: { id } }) =>
        HttpResponse.json({
          id: Number(id),
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
    http.get(
      "https://api.themoviedb.org/3/:mediaType/:id/images",
      ({ params: { id } }) =>
        HttpResponse.json({
          id: Number(id),
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
    // Stored, rather than set by the environment, which would lock the plugins for the settings pages
    await em.upsert(Setting, {
      namespace: CORE_NAMESPACE,
      key: "enabledPlugins",
      value: CorePlugins.options,
    });

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

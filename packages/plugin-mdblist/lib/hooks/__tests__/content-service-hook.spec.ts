import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/mdblist.test-context.ts";
import plugin from "../../index.ts";

describe("mdblist plugin hooks", () => {
  it("content-service.requested returns movies and shows from lists", async ({
    server,
    dataSourceMap,
    settings,
  }) => {
    server.use(
      http.get("https://mdblist.com/api/lists/:listId/items", () =>
        HttpResponse.json([
          {
            rank: 1,
            adult: false,
            title: "Test Movie",
            language: "en",
            mediatype: "movie",
            release_year: 2024,
            country: "us",
            id: 1,
            imdb_id: "tt1234567",
            tmdb_id: 123,
            tvdb_id: null,
          },
        ]),
      ),
    );

    const hook = plugin.hooks["riven.content-service.requested"];
    const result = await hook({
      dataSources: dataSourceMap,
      settings,
      event: {},
    } as Parameters<typeof hook>[0]);

    expect(result.movies.length).toBeGreaterThanOrEqual(0);
  });
});

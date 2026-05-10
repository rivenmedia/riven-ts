import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/seerr.test-context.ts";
import plugin from "../../index.ts";

describe("seerr plugin hooks", () => {
  it("content-service.requested returns movies and shows", async ({
    server,
    dataSourceMap,
    settings,
  }) => {
    server.use(
      http.get("http://localhost:5055/api/v1/request", ({ request }) => {
        const url = new URL(request.url);
        const skip = url.searchParams.get("skip");

        if (skip === "0") {
          return HttpResponse.json({
            pageInfo: { pages: 1, results: 1 },
            results: [
              {
                id: 1,
                type: "movie",
                status: 2,
                media: { tmdbId: 123 },
                requestedBy: {
                  id: 1,
                  email: "test@test.com",
                  createdAt: "2024-01-01",
                  updatedAt: "2024-01-01",
                },
              },
            ],
          });
        }

        return HttpResponse.json({
          pageInfo: { pages: 1, results: 0 },
          results: [],
        });
      }),
    );

    const hook = plugin.hooks["riven.content-service.requested"];
    const result = await hook({
      dataSources: dataSourceMap,
      settings,
      event: {},
    } as Parameters<typeof hook>[0]);

    expect(result.movies).toHaveLength(1);
    expect(result.movies[0]?.tmdbId).toBe("123");
  });

  it("validator calls api.validate", async ({ server, dataSourceMap }) => {
    server.use(
      http.get("http://localhost:5055/api/v1/auth/me", () =>
        HttpResponse.json({ id: 1, email: "test@test.com" }),
      ),
      http.get("http://localhost:5055/api/v1/settings/metadatas", () =>
        HttpResponse.json({ tv: "tvdb", anime: "tvdb" }),
      ),
    );

    const result = await plugin.validator({
      dataSources: dataSourceMap,
    } as Parameters<typeof plugin.validator>[0]);

    expect(result).toBe(true);
  });
});

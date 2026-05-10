import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { describe, expect, vi } from "vitest";

import { it } from "../../__tests__/comet.test-context.ts";
import plugin from "../../index.ts";

describe("comet plugin hooks", () => {
  it("scrape.requested returns results from the Comet API", async ({
    server,
    dataSourceMap,
    settings,
  }) => {
    server.use(
      http.get("**/stream/movie/tt1234567.json", () =>
        HttpResponse.json({
          streams: [
            {
              infoHash: "abc123",
              description: "🎬 Test.Movie.2024.1080p.WEB\n📦 2GB",
              behaviorHints: {},
            },
          ],
        }),
      ),
    );

    const hook = plugin.hooks["riven.media-item.scrape.requested"];

    const item = Object.assign(Object.create(Movie.prototype), {
      id: "test-id",
      imdbId: "tt1234567",
      title: "Test Movie",
      fullTitle: "Test Movie (2024)",
    });

    const result = await hook({
      dataSources: dataSourceMap,
      settings,
      event: { item },
    } as Parameters<typeof hook>[0]);

    expect(result.id).toBe("test-id");
    expect(result.results).toBeDefined();
  });
});

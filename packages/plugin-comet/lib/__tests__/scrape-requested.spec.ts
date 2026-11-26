import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "./comet.test-context.ts";

it("returns the scraped torrents for the item", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const scrapeRequestedHook = plugin.hooks["riven.media-item.scrape.requested"];

  expect.assert(scrapeRequestedHook);

  const item = new Movie();

  item.imdbId = "tt0133093";
  item.fullTitle = "The Matrix";

  server.use(
    http.get("https://comet.feels.legal/stream/movie/tt0133093.json", () =>
      HttpResponse.json({
        streams: [
          {
            name: "Comet",
            description: "📄 The Matrix 1999 1080p",
            infoHash: "a".repeat(40),
            behaviorHints: {},
          },
        ],
      }),
    ),
  );

  const response = await scrapeRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: { item },
    logger,
  });

  expect(response).toStrictEqual({
    id: item.id,
    results: { ["a".repeat(40)]: "The Matrix 1999 1080p" },
  });
});

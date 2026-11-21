import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/torrentio.test-context.ts";
import { TorrentioAPI } from "./torrentio.datasource.ts";

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);

const createMovie = (imdbId: string | null = "tt0133093") => {
  const movie = new Movie();

  movie.imdbId = imdbId;
  movie.fullTitle = "The Matrix";

  return movie;
};

const streamsHandler = (
  streams: { title: string; infoHash: string }[],
  requestedPaths: string[] = [],
) =>
  http.get("https://torrentio.strem.fun/*", ({ request }) => {
    requestedPaths.push(decodeURIComponent(new URL(request.url).pathname));

    return HttpResponse.json({ streams });
  });

it("returns the first line of each stream title keyed by its info hash", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    streamsHandler([
      {
        title: "The.Matrix.1999.1080p.BluRay\n👤 25 💾 2 GB ⚙️ ThePirateBay",
        infoHash: HASH_A,
      },
      {
        title: "The Matrix Pack\nThe.Matrix.1999.mkv\n👤 3 💾 9 GB",
        infoHash: HASH_B,
      },
    ]),
  );

  const torrents = await dataSourceMap
    .get(TorrentioAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({
    [HASH_A]: "The.Matrix.1999.1080p.BluRay",
    [HASH_B]: "The Matrix Pack",
  });
});

it("skips streams without a title", async ({ server, dataSourceMap }) => {
  server.use(
    streamsHandler([
      { title: "\n👤 25 💾 2 GB", infoHash: HASH_A },
      { title: "Title\n👤 1", infoHash: HASH_B },
    ]),
  );

  const torrents = await dataSourceMap
    .get(TorrentioAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({ [HASH_B]: "Title" });
});

it("returns no torrents without requesting streams when the item has no IMDB ID", async ({
  server,
  dataSourceMap,
}) => {
  const requestedPaths: string[] = [];

  server.use(streamsHandler([], requestedPaths));

  const torrents = await dataSourceMap
    .get(TorrentioAPI)
    .scrape({ item: createMovie(null) });

  expect(torrents).toStrictEqual({});
  expect(requestedPaths).toStrictEqual([]);
});

it("returns no torrents when the request fails", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://torrentio.strem.fun/*", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const torrents = await dataSourceMap
    .get(TorrentioAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({});
});

it("returns the scraped torrents from the scrape requested hook", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const scrapeRequestedHook = plugin.hooks["riven.media-item.scrape.requested"];

  expect.assert(scrapeRequestedHook);

  const item = createMovie();

  server.use(streamsHandler([{ title: "Title", infoHash: HASH_A }]));

  const response = await scrapeRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: { item },
    logger,
  });

  expect(response).toStrictEqual({
    id: item.id,
    results: { [HASH_A]: "Title" },
  });
});

import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { createMockSeasonReference } from "@repo/util-plugin-testing/create-mock-season-reference";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/stremthru.test-context.ts";
import { StremThruTorznabAPI } from "./stremthru-torznab.datasource.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const TORZNAB_URL = "https://stremthru.13377001.xyz/v0/torznab/api";

const withDetails = <T extends MediaItem>(item: T, imdbId: string | null) => {
  item.imdbId = imdbId;
  item.title = "Game of Thrones";
  item.fullTitle = "Game of Thrones";

  return item;
};

const createSeason = () => {
  const season = withDetails(new Season(), "tt0944947");

  season.number = 2;

  return season;
};

const createEpisode = () => {
  const episode = withDetails(new Episode(), "tt0944947");

  episode.number = 5;
  episode.season = createMockSeasonReference(3);

  return episode;
};

const torznabItem = (title: string, attributes: Record<string, string>) => ({
  title,
  attr: Object.entries(attributes).map(([name, value]) => ({
    "@attributes": { name, value },
  })),
});

const torznabHandler = (
  body: Record<string, unknown>,
  requestedParams: [string, string][][] = [],
) =>
  http.get(TORZNAB_URL, ({ request }) => {
    requestedParams.push([...new URL(request.url).searchParams]);

    return HttpResponse.json(body);
  });

it.for([
  {
    type: "movie",
    createItem: () => withDetails(new Movie(), "tt0133093"),
    params: [
      ["o", "json"],
      ["imdbid", "tt0133093"],
      ["t", "movie"],
      ["cat", "2000"],
    ],
  },
  {
    type: "show",
    createItem: () => withDetails(new Show(), "tt0944947"),
    params: [
      ["o", "json"],
      ["imdbid", "tt0944947"],
      ["t", "tvsearch"],
      ["cat", "5000"],
    ],
  },
  {
    type: "season",
    createItem: createSeason,
    params: [
      ["o", "json"],
      ["imdbid", "tt0944947"],
      ["t", "tvsearch"],
      ["cat", "5000"],
      ["season", "2"],
      ["ep", "1"],
    ],
  },
  {
    type: "episode",
    createItem: createEpisode,
    params: [
      ["o", "json"],
      ["imdbid", "tt0944947"],
      ["t", "tvsearch"],
      ["cat", "5000"],
      ["season", "3"],
      ["ep", "5"],
    ],
  },
  {
    type: "movie without an IMDB ID",
    createItem: () => withDetails(new Movie(), null),
    params: [
      ["o", "json"],
      ["q", "Game of Thrones"],
      ["t", "movie"],
      ["cat", "2000"],
    ],
  },
])(
  "searches for a $type",
  async ({ createItem, params }, { server, dataSourceMap }) => {
    const requestedParams: [string, string][][] = [];

    server.use(torznabHandler({ channel: {} }, requestedParams));

    await dataSourceMap.get(StremThruTorznabAPI).scrape({ item: createItem() });

    expect(requestedParams).toStrictEqual([params]);
  },
);

it("returns the title of each result keyed by its info hash", async ({
  server,
  dataSourceMap,
}) => {
  const hashA = "a".repeat(40);
  const hashB = "b".repeat(40);

  server.use(
    torznabHandler({
      channel: {
        items: [
          torznabItem("Game.of.Thrones.S02.1080p", {
            size: "1000",
            infohash: hashA,
          }),
          torznabItem("No Info Hash", { size: "1000" }),
          torznabItem("", { infohash: "c".repeat(40) }),
          torznabItem("Game.of.Thrones.S02.720p", { infohash: hashB }),
        ],
      },
    }),
  );

  const torrents = await dataSourceMap
    .get(StremThruTorznabAPI)
    .scrape({ item: createSeason() });

  expect(torrents).toStrictEqual({
    [hashA]: "Game.of.Thrones.S02.1080p",
    [hashB]: "Game.of.Thrones.S02.720p",
  });
});

it("returns no torrents when the response is malformed", async ({
  server,
  dataSourceMap,
}) => {
  server.use(torznabHandler({ error: "Unknown indexer" }));

  const torrents = await dataSourceMap
    .get(StremThruTorznabAPI)
    .scrape({ item: createSeason() });

  expect(torrents).toStrictEqual({});
});

it("returns no torrents when the request fails", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(TORZNAB_URL, () => HttpResponse.json(null, { status: 500 })),
  );

  const torrents = await dataSourceMap
    .get(StremThruTorznabAPI)
    .scrape({ item: createSeason() });

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

  const item = createSeason();

  server.use(
    torznabHandler({
      channel: {
        items: [torznabItem("Title", { infohash: "a".repeat(40) })],
      },
    }),
  );

  const response = await scrapeRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: { item },
    logger,
  });

  expect(response).toStrictEqual({
    id: item.id,
    results: { ["a".repeat(40)]: "Title" },
  });
});

it.for([
  { response: () => HttpResponse.json({}), expected: true },
  { response: () => HttpResponse.json(null, { status: 503 }), expected: false },
])(
  "validates the Torznab endpoint (valid: $expected)",
  async ({ response, expected }, { server, dataSourceMap }) => {
    server.use(http.get(TORZNAB_URL, response));

    await expect(
      dataSourceMap.get(StremThruTorznabAPI).validate(),
    ).resolves.toBe(expected);
  },
);

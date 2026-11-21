import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { createMockSeasonReference } from "@repo/util-plugin-testing/create-mock-season-reference";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/comet.test-context.ts";
import { CometAPI } from "./comet.datasource.ts";

import type { CometScrapeResponse } from "../schemas/scrape-response.schema.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);
const HASH_C = "c".repeat(40);

const withIds = <T extends MediaItem>(item: T, imdbId: string | null) => {
  item.id = "00000000-0000-4000-8000-000000000001";
  item.imdbId = imdbId;
  item.fullTitle = "Test Item";

  return item;
};

const createMovie = (imdbId: string | null = "tt0133093") =>
  withIds(new Movie(), imdbId);

const createShow = () => withIds(new Show(), "tt0944947");

const createSeason = () => {
  const season = withIds(new Season(), "tt0944947");

  season.number = 2;

  return season;
};

const createEpisode = () => {
  const episode = withIds(new Episode(), "tt0944947");

  episode.number = 5;
  episode.season = createMockSeasonReference(3);

  return episode;
};

const streamsHandler = (
  streams: CometScrapeResponse["streams"],
  requestedPaths: string[] = [],
) =>
  http.get("https://comet.feels.legal/stream/*", ({ request }) => {
    requestedPaths.push(new URL(request.url).pathname);

    return HttpResponse.json<CometScrapeResponse>({ streams });
  });

it.for([
  {
    type: "movie",
    createItem: createMovie,
    path: "/stream/movie/tt0133093.json",
  },
  {
    type: "show",
    createItem: createShow,
    path: "/stream/series/tt0944947.json",
  },
  {
    type: "season",
    createItem: createSeason,
    path: "/stream/series/tt0944947:2.json",
  },
  {
    type: "episode",
    createItem: createEpisode,
    path: "/stream/series/tt0944947:3:5.json",
  },
])(
  "requests the streams of a $type",
  async ({ createItem, path }, { server, dataSourceMap }) => {
    server.use(
      http.get(`https://comet.feels.legal${path}`, () =>
        HttpResponse.json<CometScrapeResponse>({
          streams: [
            {
              name: "Comet",
              description: "📄 Title",
              infoHash: HASH_A,
              behaviorHints: {},
            },
          ],
        }),
      ),
    );

    await expect(
      dataSourceMap.get(CometAPI).scrape({ item: createItem() }),
    ).resolves.toStrictEqual({ [HASH_A]: "Title" });
  },
);

it("returns the title of each torrent keyed by its info hash", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    streamsHandler([
      { name: "[🔄] Comet", url: "https://comet.feels.legal/playback" },
      {
        name: "Comet",
        description: "📄 Description Title\n💾 1.5 GB",
        infoHash: HASH_A,
        behaviorHints: { filename: "The.Matrix.1999.1080p.mkv" },
      },
      {
        name: "Comet",
        description: "📄 The Matrix 1999 2160p\n💾 20 GB",
        infoHash: HASH_B,
        behaviorHints: {},
      },
    ]),
  );

  const torrents = await dataSourceMap
    .get(CometAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({
    [HASH_A]: "The.Matrix.1999.1080p.mkv",
    [HASH_B]: "The Matrix 1999 2160p",
  });
});

it("skips streams without a title", async ({ server, dataSourceMap }) => {
  server.use(
    streamsHandler([
      {
        name: "Comet",
        description: "📄",
        infoHash: HASH_A,
        behaviorHints: {},
      },
      {
        name: "Comet",
        description: "📄 Title",
        infoHash: HASH_C,
        behaviorHints: {},
      },
    ]),
  );

  const torrents = await dataSourceMap
    .get(CometAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({ [HASH_C]: "Title" });
});

it("returns no torrents without requesting streams when the item has no IMDB ID", async ({
  server,
  dataSourceMap,
}) => {
  const requestedPaths: string[] = [];

  server.use(streamsHandler([], requestedPaths));

  const torrents = await dataSourceMap
    .get(CometAPI)
    .scrape({ item: createMovie(null) });

  expect(torrents).toStrictEqual({});
  expect(requestedPaths).toStrictEqual([]);
});

it("returns no torrents when the request fails", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://comet.feels.legal/stream/*", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const torrents = await dataSourceMap
    .get(CometAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({});
});

it("returns no torrents when the response is malformed", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("https://comet.feels.legal/stream/*", () =>
      HttpResponse.json({
        streams: [{ name: "Comet", infoHash: "not-a-hash" }],
      }),
    ),
  );

  const torrents = await dataSourceMap
    .get(CometAPI)
    .scrape({ item: createMovie() });

  expect(torrents).toStrictEqual({});
});

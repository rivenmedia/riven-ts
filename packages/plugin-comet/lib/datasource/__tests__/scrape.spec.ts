import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/comet.test-context.ts";
import { CometAPI } from "../comet.datasource.ts";

function createMovie(overrides = {}) {
  return Object.assign(Object.create(Movie.prototype), {
    imdbId: "tt1234567",
    title: "Test Movie",
    fullTitle: "Test Movie (2024)",
    ...overrides,
  });
}

function createShow(overrides = {}) {
  return Object.assign(Object.create(Show.prototype), {
    imdbId: "tt7654321",
    title: "Test Show",
    fullTitle: "Test Show",
    ...overrides,
  });
}

function createSeason(overrides = {}) {
  return Object.assign(Object.create(Season.prototype), {
    imdbId: "tt7654321",
    title: "Test Show S02",
    fullTitle: "Test Show S02",
    number: 2,
    ...overrides,
  });
}

function createEpisode(overrides = {}) {
  return Object.assign(Object.create(Episode.prototype), {
    imdbId: "tt7654321",
    title: "Pilot",
    fullTitle: "Test Show S01E05",
    number: 5,
    season: { loadProperty: vi.fn().mockResolvedValue(1) },
    ...overrides,
  });
}

it("scrapes movie torrents", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({
        streams: [
          {
            name: "torrent",
            description: "🎬 Test.Movie.2024.1080p\n📦 5GB",
            infoHash: "abc123def456abc123def456abc123def456abc1",
            behaviorHints: { filename: "Test.Movie.2024.1080p.mkv" },
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({
    abc123def456abc123def456abc123def456abc1: "Test.Movie.2024.1080p.mkv",
  });
});

it("scrapes show torrents", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/stream/series/tt7654321.json", () =>
      HttpResponse.json({
        streams: [
          {
            name: "torrent",
            description: "🎬 Test.Show.S01.1080p\n📦 10GB",
            infoHash: "def456abc123def456abc123def456abc123def4",
            behaviorHints: { filename: "Test.Show.S01.1080p.mkv" },
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createShow() });

  expect(result).toEqual({
    def456abc123def456abc123def456abc123def4: "Test.Show.S01.1080p.mkv",
  });
});

it("scrapes season torrents with season identifier", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/series/tt7654321:2.json", () =>
      HttpResponse.json({
        streams: [
          {
            name: "torrent",
            description: "🎬 Test.Show.S02.1080p\n📦 8GB",
            infoHash: "aaa456abc123def456abc123def456abc123def4",
            behaviorHints: {},
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createSeason() });

  expect(Object.keys(result)).toHaveLength(1);
});

it("scrapes episode torrents with season:episode identifier", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(/\/stream\/series\/tt7654321/, () =>
      HttpResponse.json({
        streams: [
          {
            name: "torrent",
            description: "🎬 Test.Show.S01E05.1080p\n📦 1GB",
            infoHash: "bbb456abc123def456abc123def456abc123def4",
            behaviorHints: { filename: "Test.Show.S01E05.1080p.mkv" },
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createEpisode() });

  expect(Object.keys(result)).toHaveLength(1);
});

it("skips streams with url property (non-torrent results)", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({
        streams: [
          {
            name: "[🔄] Comet",
            url: "https://comet.example.com/redirect",
          },
          {
            name: "torrent",
            description: "🎬 Real.Torrent.1080p\n📦 5GB",
            infoHash: "ccc456abc123def456abc123def456abc123def4",
            behaviorHints: {},
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(Object.keys(result)).toHaveLength(1);
});

it("returns empty object when no streams found", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({ streams: [] }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

it("returns empty object on error", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

it("throws error when no imdbId", async ({ dataSourceMap }) => {
  const api = dataSourceMap.get(CometAPI);
  const result = await api.scrape({
    item: createMovie({ imdbId: undefined }),
  });

  expect(result).toEqual({});
});

import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/torrentio.test-context.ts";
import { TorrentioAPI } from "../torrentio.datasource.ts";

function createMovie(overrides = {}) {
  return Object.assign(Object.create(Movie.prototype), {
    imdbId: "tt1234567",
    title: "Test Movie",
    fullTitle: "Test Movie (2024)",
    ...overrides,
  });
}

it("scrapes movie torrents and strips peer info", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({
        streams: [
          {
            title: "Test.Movie.2024.1080p\n👤 50",
            infoHash: "abc123def456abc123def456abc123def456abc1",
          },
          {
            title: "Test.Movie.2024.720p\nSome extra info",
            infoHash: "def456abc123def456abc123def456abc123def4",
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(TorrentioAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({
    abc123def456abc123def456abc123def456abc1: "Test.Movie.2024.1080p",
    def456abc123def456abc123def456abc123def4: "Test.Movie.2024.720p",
  });
});

it("returns empty object when no streams", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({ streams: [] }),
    ),
  );

  const api = dataSourceMap.get(TorrentioAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

it("returns empty object on error", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const api = dataSourceMap.get(TorrentioAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

it("returns empty object when imdbId is missing", async ({ dataSourceMap }) => {
  const api = dataSourceMap.get(TorrentioAPI);
  const result = await api.scrape({
    item: createMovie({ imdbId: undefined }),
  });

  expect(result).toEqual({});
});

it("skips streams with empty rawTitle after splitting and logs no torrents found", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/stream/movie/tt1234567.json", () =>
      HttpResponse.json({
        streams: [
          {
            title: "\n👤 50",
            infoHash: "abc123def456abc123def456abc123def456abc1",
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(TorrentioAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

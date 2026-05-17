import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";
import { vi } from "vitest";

import { it } from "../../__tests__/stremthru.test-context.ts";
import { StremThruTorznabAPI } from "../stremthru-torznab.datasource.ts";

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
    title: "Test Show S01",
    fullTitle: "Test Show S01",
    number: 1,
    ...overrides,
  });
}

function createEpisode(overrides = {}) {
  return Object.assign(Object.create(Episode.prototype), {
    imdbId: "tt7654321",
    title: "Pilot",
    fullTitle: "Test Show S01E01",
    number: 1,
    season: { loadProperty: vi.fn().mockResolvedValue(1) },
    ...overrides,
  });
}

it("scrapes movie torrents", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json({
        channel: {
          items: [
            {
              title: "Test.Movie.2024.1080p",
              attr: [
                {
                  "@attributes": {
                    name: "infohash",
                    value: "abc123def456abc123def456abc123def456abc1",
                  },
                },
              ],
            },
          ],
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({
    abc123def456abc123def456abc123def456abc1: "Test.Movie.2024.1080p",
  });
});

it("scrapes show torrents with tvsearch type", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/torznab/api", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("t")).toBe("tvsearch");
      expect(url.searchParams.get("cat")).toBe("5000");

      return HttpResponse.json({
        channel: {
          items: [
            {
              title: "Test.Show.S01.1080p",
              attr: [
                {
                  "@attributes": {
                    name: "infohash",
                    value: "def456abc123def456abc123def456abc123def4",
                  },
                },
              ],
            },
          ],
        },
      });
    }),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({ item: createShow() });

  expect(result).toEqual({
    def456abc123def456abc123def456abc123def4: "Test.Show.S01.1080p",
  });
});

it("scrapes season with season number param", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/torznab/api", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("season")).toBe("1");

      return HttpResponse.json({
        channel: {
          items: [
            {
              title: "Test.Show.S01.1080p",
              attr: [
                {
                  "@attributes": {
                    name: "infohash",
                    value: "aaa456abc123def456abc123def456abc123def4",
                  },
                },
              ],
            },
          ],
        },
      });
    }),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({ item: createSeason() });

  expect(Object.keys(result)).toHaveLength(1);
});

it("scrapes episode with season and episode params", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/torznab/api", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("season")).toBe("1");
      expect(url.searchParams.get("ep")).toBe("1");

      return HttpResponse.json({
        channel: {
          items: [
            {
              title: "Test.Show.S01E01.1080p",
              attr: [
                {
                  "@attributes": {
                    name: "infohash",
                    value: "bbb456abc123def456abc123def456abc123def4",
                  },
                },
              ],
            },
          ],
        },
      });
    }),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({ item: createEpisode() });

  expect(Object.keys(result)).toHaveLength(1);
});

it("uses title for query when no imdbId", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/v0/torznab/api", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("q")).toBe("No IMDB Movie");
      expect(url.searchParams.has("imdbid")).toBe(false);

      return HttpResponse.json({
        channel: { items: [] },
      });
    }),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({
    item: createMovie({ imdbId: undefined, title: "No IMDB Movie" }),
  });

  expect(result).toEqual({});
});

it("returns empty object on error", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorznabAPI);
  const result = await api.scrape({ item: createMovie() });

  expect(result).toEqual({});
});

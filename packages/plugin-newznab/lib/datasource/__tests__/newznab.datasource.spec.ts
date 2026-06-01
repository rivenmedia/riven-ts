import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/newznab.test-context.ts";
import { NewznabAPI } from "../newznab.datasource.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAttr = (name: string, value: string) => ({
  "@attributes": { name, value },
});

const GOOD_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB — within default bounds

const makeItem = (
  overrides: Partial<{
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    category: string;
    sizeBytes: number;
  }> = {},
) => ({
  title: overrides.title ?? "Test NZB",
  link: overrides.link ?? "https://indexer.example.com/nzb/1",
  guid: overrides.guid ?? "1",
  pubDate: overrides.pubDate ?? "Tue, 25 Feb 2025 12:34:56 +0000",
  category: overrides.category ?? "5040",
  attr: [makeAttr("size", String(overrides.sizeBytes ?? GOOD_SIZE))],
});

const makeResponse = (items: ReturnType<typeof makeItem>[]) => ({
  channel: {
    response: { "@attributes": { offset: "0", total: String(items.length) } },
    item: items.length === 1 ? items[0] : items,
  },
});

// ---------------------------------------------------------------------------
// validate()
// ---------------------------------------------------------------------------

it("validate() returns true when the caps endpoint responds 200", async ({
  server,
  dataSourceMap,
}) => {
  server.use(http.get("**/api", () => HttpResponse.json({ caps: {} })));

  const api = dataSourceMap.get(NewznabAPI);
  const result = await api.validate();

  expect(result).toBe(true);
});

it("validate() returns false when the caps endpoint returns an error", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({ error: "no-auth" }, { status: 401 }),
    ),
  );

  const api = dataSourceMap.get(NewznabAPI);
  const result = await api.validate();

  expect(result).toBe(false);
});

// ---------------------------------------------------------------------------
// scrape() — query construction
// ---------------------------------------------------------------------------

it("scrape() queries the movie endpoint with numeric IMDB ID for a movie item", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem()]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Inception",
      imdbId: "tt1375666",
      type: "movie",
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("movie");
  // IMDB ID must be stripped of "tt" prefix
  expect(url.searchParams.get("imdbid")).toBe("1375666");
  expect(url.searchParams.get("o")).toBe("json");
  expect(url.searchParams.get("cat")).toBe("2040,2045");
});

it("scrape() queries the tvsearch endpoint for a show-level item without season/ep", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem({ category: "5040" })]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000002",
      title: "Breaking Bad",
      imdbId: "tt0903747",
      tvdbId: "81189",
      type: "show",
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("tvsearch");
  // nzbgeek (and Newznab tvsearch generally) does not support imdbid — its caps
  // advertise supportedParams "q,rid,tvdbid,tvmazeid,season,ep". TV scrapes must
  // key on tvdbid, never imdbid (which silently returns zero results).
  expect(url.searchParams.get("tvdbid")).toBe("81189");
  expect(url.searchParams.has("imdbid")).toBe(false);
  expect(url.searchParams.get("cat")).toBe("5040,5045");
  // Show-level scrape: neither season nor ep should be sent
  expect(url.searchParams.has("season")).toBe(false);
  expect(url.searchParams.has("ep")).toBe(false);
});

it("scrape() forwards season but NOT ep for a season-level tvsearch", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem({ category: "5040" })]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000007",
      title: "Breaking Bad Season 2",
      imdbId: "tt0903747",
      tvdbId: "81189",
      type: "season",
      seasonNumber: 2,
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("tvsearch");
  expect(url.searchParams.get("tvdbid")).toBe("81189");
  expect(url.searchParams.has("imdbid")).toBe(false);
  expect(url.searchParams.get("season")).toBe("2");
  expect(url.searchParams.has("ep")).toBe(false);
});

it("scrape() forwards BOTH season and ep for an episode-level tvsearch", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem({ category: "5040" })]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000008",
      title: "Breaking Bad S01E02",
      imdbId: "tt0903747",
      tvdbId: "81189",
      type: "episode",
      seasonNumber: 1,
      episodeNumber: 2,
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("tvsearch");
  expect(url.searchParams.get("tvdbid")).toBe("81189");
  expect(url.searchParams.has("imdbid")).toBe(false);
  expect(url.searchParams.get("season")).toBe("1");
  expect(url.searchParams.get("ep")).toBe("2");
});

it("scrape() forwards season=0 for specials (boundary case)", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem({ category: "5040" })]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000009",
      title: "Breaking Bad Specials",
      imdbId: "tt0903747",
      tvdbId: "81189",
      type: "season",
      seasonNumber: 0,
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  // Critical: season=0 (specials) must be forwarded, not treated as falsy
  expect(url.searchParams.get("season")).toBe("0");
});

it("scrape() falls back to title search for a TV item with no tvdbId", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem({ category: "5040" })]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-00000000000b",
      title: "Obscure Show",
      // imdbId is useless for nzbgeek tvsearch, and there is no tvdbId — the
      // only viable query is a free-text title search.
      imdbId: "tt0903747",
      tvdbId: null,
      type: "show",
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("search");
  expect(url.searchParams.get("q")).toBe("Obscure Show");
  expect(url.searchParams.has("tvdbid")).toBe(false);
  expect(url.searchParams.has("imdbid")).toBe(false);
});

it("scrape() never sends season/ep for a movie even if the payload carries them", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem()]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-00000000000a",
      title: "Inception",
      imdbId: "tt1375666",
      type: "movie",
      // These should be ignored — movies use the t=movie endpoint, which has
      // no concept of season/episode.
      seasonNumber: 1,
      episodeNumber: 2,
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("movie");
  expect(url.searchParams.has("season")).toBe(false);
  expect(url.searchParams.has("ep")).toBe(false);
});

it("scrape() falls back to title search when no IMDB ID is provided", async ({
  server,
  dataSourceMap,
}) => {
  let capturedUrl: string | undefined;

  server.use(
    http.get("**/api", ({ request }) => {
      capturedUrl = request.url;
      return HttpResponse.json(makeResponse([makeItem()]));
    }),
  );

  const api = dataSourceMap.get(NewznabAPI);
  await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000003",
      title: "Unknown Movie",
      imdbId: null,
      type: "movie",
    },
  });

  assert(capturedUrl);
  const url = new URL(capturedUrl);
  expect(url.searchParams.get("t")).toBe("search");
  expect(url.searchParams.get("q")).toBe("Unknown Movie");
  expect(url.searchParams.has("imdbid")).toBe(false);
});

// ---------------------------------------------------------------------------
// scrape() — response parsing and size filtering
// ---------------------------------------------------------------------------

it("scrape() returns candidates that pass the size filter", async ({
  server,
  dataSourceMap,
}) => {
  const goodItem = makeItem({ sizeBytes: GOOD_SIZE, title: "Good Size NZB" });
  const tinyItem = makeItem({ sizeBytes: 1024, title: "Too Small NZB" });

  server.use(
    http.get("**/api", () =>
      HttpResponse.json(makeResponse([goodItem, tinyItem])),
    ),
  );

  const api = dataSourceMap.get(NewznabAPI);
  const candidates = await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000004",
      title: "Inception",
      imdbId: "tt1375666",
      type: "movie",
    },
  });

  expect(candidates).toHaveLength(1);
  expect(candidates[0]?.title).toBe("Good Size NZB");
});

it("scrape() returns an empty array when the indexer returns no items", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({
        channel: { response: { "@attributes": { offset: "0", total: "0" } } },
      }),
    ),
  );

  const api = dataSourceMap.get(NewznabAPI);
  const candidates = await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000005",
      title: "Obscure Film",
      imdbId: "tt9999999",
      type: "movie",
    },
  });

  expect(candidates).toEqual([]);
});

it("scrape() returns an empty array when the indexer returns a non-200 response", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({ error: "server error" }, { status: 500 }),
    ),
  );

  const api = dataSourceMap.get(NewznabAPI);
  const candidates = await api.scrape({
    item: {
      id: "00000000-0000-0000-0000-000000000006",
      title: "Error Movie",
      imdbId: "tt1111111",
      type: "movie",
    },
  });

  expect(candidates).toEqual([]);
});

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/seerr.test-context.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

it("retrieves movies and shows from requests", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v1/request", ({ request }) => {
      const url = new URL(request.url);
      const skip = parseInt(url.searchParams.get("skip") ?? "0", 10);

      if (skip === 0) {
        return HttpResponse.json({
          pageInfo: { results: 2 },
          results: [
            {
              id: 1,
              status: 2,
              type: "movie",
              media: { tmdbId: 100 },
              requestedBy: {
                id: 1,
                email: "user@test.com",
                createdAt: "2024-01-01",
                updatedAt: "2024-01-01",
              },
              seasons: [],
            },
            {
              id: 2,
              status: 2,
              type: "tv",
              media: { tvdbId: 200, tmdbId: 201, id: 10 },
              requestedBy: {
                id: 1,
                email: "user@test.com",
                createdAt: "2024-01-01",
                updatedAt: "2024-01-01",
              },
              seasons: [
                { id: 20, status: 2, seasonNumber: 1 },
                { id: 21, status: 2, seasonNumber: 2 },
              ],
            },
          ],
        });
      }

      return HttpResponse.json({ pageInfo: { results: 2 }, results: [] });
    }),
  );

  const api = dataSourceMap.get(SeerrAPI);
  const result = await api.getContent("all");

  expect(result.movies).toEqual([
    {
      tmdbId: "100",
      externalRequestId: "1",
      requestedBy: "user@test.com",
    },
  ]);
  expect(result.shows).toEqual([
    {
      tmdbId: "201",
      tvdbId: "200",
      externalRequestId: "10",
      requestedBy: "user@test.com",
      seasons: [1, 2],
    },
  ]);
});

it("combines seasons from multiple requests for the same show", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api/v1/request", () =>
      HttpResponse.json({
        pageInfo: { results: 2 },
        results: [
          {
            id: 1,
            status: 2,
            type: "tv",
            media: { tvdbId: 300, tmdbId: 301, id: 20 },
            requestedBy: {
              id: 1,
              email: "user@test.com",
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01",
            },
            seasons: [
              { id: 30, status: 2, seasonNumber: 1 },
              { id: 31, status: 2, seasonNumber: 2 },
            ],
          },
          {
            id: 2,
            status: 2,
            type: "tv",
            media: { tvdbId: 300, tmdbId: 301, id: 20 },
            requestedBy: {
              id: 1,
              email: "user@test.com",
              createdAt: "2024-01-01",
              updatedAt: "2024-01-01",
            },
            seasons: [{ id: 32, status: 2, seasonNumber: 3 }],
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SeerrAPI);
  const result = await api.getContent("all");

  expect(result.shows).toHaveLength(1);
  expect(result.shows[0]!.seasons).toEqual(expect.arrayContaining([1, 2, 3]));
});

it("skips movies without tmdbId", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/api/v1/request", () =>
      HttpResponse.json({
        pageInfo: { results: 1 },
        results: [
          {
            id: 1,
            status: 2,
            type: "movie",
            media: {},
            seasons: [],
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SeerrAPI);
  const result = await api.getContent("all");

  expect(result.movies).toEqual([]);
});

it("skips shows without tvdbId", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/api/v1/request", () =>
      HttpResponse.json({
        pageInfo: { results: 1 },
        results: [
          {
            id: 1,
            status: 2,
            type: "tv",
            media: { tmdbId: 100 },
            seasons: [{ id: 40, status: 2, seasonNumber: 1 }],
          },
        ],
      }),
    ),
  );

  const api = dataSourceMap.get(SeerrAPI);
  const result = await api.getContent("all");

  expect(result.shows).toEqual([]);
});

it("paginates through all requests", async ({ server, dataSourceMap }) => {
  let callCount = 0;

  server.use(
    http.get("**/api/v1/request", () => {
      callCount++;

      if (callCount === 1) {
        return HttpResponse.json({
          pageInfo: { results: 30 },
          results: Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            status: 2,
            type: "movie" as const,
            media: { tmdbId: i + 1 },
            seasons: [],
          })),
        });
      }

      return HttpResponse.json({
        pageInfo: { results: 30 },
        results: Array.from({ length: 10 }, (_, i) => ({
          id: i + 21,
          status: 2,
          type: "movie" as const,
          media: { tmdbId: i + 21 },
          seasons: [],
        })),
      });
    }),
  );

  const api = dataSourceMap.get(SeerrAPI);
  const result = await api.getContent("all");

  expect(result.movies).toHaveLength(30);
  expect(callCount).toBe(2);
});

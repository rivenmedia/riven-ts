import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/mdblist.test-context.ts";
import { MdblistAPI } from "../mdblist.datasource.ts";

it("returns empty arrays when no content lists provided", async ({
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(MdblistAPI);
  const result = await api.getListItems(new Set());

  expect(result).toEqual({ movies: [], shows: [] });
});

it("retrieves movies and shows from list", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/lists/user1/my-list/items", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("apikey")).toBe("mock-api-key");

      return HttpResponse.json(
        {
          movies: [
            {
              id: 1,
              rank: null,
              adult: 0,
              title: "Test Movie",
              imdb_id: "tt1234567",
              tvdb_id: null,
              ids: {
                imdb: "tt1234567",
                tmdb: 12345,
                mdblist: "mdb-1",
                tvdb: 111,
              },
              language: "en",
              mediatype: "movie",
              release_year: 2024,
              spoken_language: "en",
              country: "US",
            },
          ],
          shows: [
            {
              id: 2,
              rank: null,
              adult: 0,
              title: "Test Show",
              imdb_id: "tt7654321",
              tvdb_id: 222,
              language: "en",
              mediatype: "show",
              release_year: 2024,
              spoken_language: "en",
              country: "US",
            },
          ],
        },
        {
          headers: { "X-Has-More": "false" },
        },
      );
    }),
  );

  const api = dataSourceMap.get(MdblistAPI);
  const result = await api.getListItems(new Set(["user1/my-list"]));

  expect(result.movies).toEqual([
    {
      imdbId: "tt1234567",
      tmdbId: "12345",
      externalRequestId: "mdb-1",
      tvdbId: "111",
    },
  ]);
  expect(result.shows).toEqual([
    {
      imdbId: "tt7654321",
      tvdbId: "222",
    },
  ]);
});

it("paginates through list items", async ({ server, dataSourceMap }) => {
  let callCount = 0;

  server.use(
    http.get("**/lists/user1/paginated/items", () => {
      callCount++;
      const isFirstPage = callCount === 1;
      const baseId = 100 + callCount;

      return HttpResponse.json(
        {
          movies: [
            {
              id: baseId,
              rank: null,
              adult: 0,
              title: `Movie ${baseId}`,
              imdb_id: `tt100000${baseId}`,
              tvdb_id: null,
              ids: {
                imdb: `tt100000${baseId}`,
                tmdb: baseId,
                mdblist: `mdb-${baseId}`,
              },
              language: "en",
              mediatype: "movie",
              release_year: 2024,
              spoken_language: "en",
              country: "US",
            },
          ],
          shows: [],
        },
        {
          headers: {
            "X-Has-More": isFirstPage ? "true" : "false",
          },
        },
      );
    }),
  );

  const api = dataSourceMap.get(MdblistAPI);
  const result = await api.getListItems(new Set(["user1/paginated"]));

  expect(result.movies).toHaveLength(2);
  expect(callCount).toBe(2);
});

it("throws error for invalid list name format", async ({ dataSourceMap }) => {
  const api = dataSourceMap.get(MdblistAPI);

  await expect(api.getListItems(new Set(["invalid-name"]))).rejects.toThrow(
    /not a valid MDBList name/,
  );
});

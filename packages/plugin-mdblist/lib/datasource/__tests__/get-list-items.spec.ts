import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/mdblist.test-context.ts";
import { MdblistAPI } from "../mdblist.datasource.ts";

import type { GetListItemsByName200Schema as ListItemsResponse } from "../../__generated__/zod/getListItemsByNameSchema.ts";

type Movie = NonNullable<ListItemsResponse["movies"]>[number];
type Show = NonNullable<ListItemsResponse["shows"]>[number];

interface ListRequest {
  list: string;
  offset: string | null;
  apiKey: string | null;
}

const movie = (id: number, ids: Movie["ids"] = {}): Movie => ({
  id,
  rank: null,
  adult: 0,
  title: `Movie ${id.toString()}`,
  imdb_id: null,
  tvdb_id: null,
  ids,
  language: null,
  mediatype: "movie",
  release_year: null,
  spoken_language: null,
  country: null,
});

const show = (
  id: number,
  {
    imdbId = null,
    tvdbId = null,
  }: { imdbId?: string | null; tvdbId?: number | null } = {},
): Show => ({
  id,
  rank: null,
  adult: 0,
  title: `Show ${id.toString()}`,
  imdb_id: imdbId,
  tvdb_id: tvdbId,
  language: null,
  mediatype: "show",
  release_year: null,
  spoken_language: null,
  country: null,
});

const listItemsHandler = (
  lists: Record<string, ListItemsResponse>,
  requests: ListRequest[] = [],
) =>
  http.get(
    "https://api.mdblist.com/lists/:username/:listname/items",
    ({ params, request }) => {
      const list = `${String(params["username"])}/${String(params["listname"])}`;
      const { searchParams } = new URL(request.url);

      requests.push({
        list,
        offset: searchParams.get("offset"),
        apiKey: searchParams.get("apikey"),
      });

      const items = lists[list];

      if (!items) {
        return HttpResponse.json(null, { status: 404 });
      }

      return HttpResponse.json(items, { headers: { "X-Has-More": "false" } });
    },
  );

it("returns no items without requesting anything when no lists are given", async ({
  dataSourceMap,
}) => {
  const items = await dataSourceMap.get(MdblistAPI).getListItems(new Set());

  expect(items).toStrictEqual({ movies: [], shows: [] });
});

it.for(["no-slash", "too/many/slashes", "/missing-user", "missing-list/"])(
  'rejects the invalid list name "%s" before requesting any list',
  async (listName, { server, dataSourceMap }) => {
    const requests: ListRequest[] = [];

    server.use(listItemsHandler({}, requests));

    await expect(
      dataSourceMap
        .get(MdblistAPI)
        .getListItems(new Set(["user/valid", listName])),
    ).rejects.toThrow(
      `${listName} is not a valid MDBList name, format has to be "<string>/<string>"`,
    );
    expect(requests).toStrictEqual([]);
  },
);

it("maps the external IDs of movies and shows", async ({
  server,
  dataSourceMap,
}) => {
  const requests: ListRequest[] = [];

  server.use(
    listItemsHandler(
      {
        "user/list": {
          movies: [
            movie(1, {
              mdblist: "mdb-1",
              imdb: "tt0137523",
              tmdb: 550,
              tvdb: 9876,
            }),
            movie(2, { imdb: "tt0133093" }),
          ],
          shows: [show(3, { imdbId: "tt0944947", tvdbId: 121_361 }), show(4)],
        },
      },
      requests,
    ),
  );

  const items = await dataSourceMap
    .get(MdblistAPI)
    .getListItems(new Set(["user/list"]));

  expect(items).toStrictEqual({
    movies: [
      {
        imdbId: "tt0137523",
        tmdbId: "550",
        externalRequestId: "mdb-1",
        tvdbId: "9876",
      },
      {
        imdbId: "tt0133093",
        tmdbId: undefined,
        externalRequestId: undefined,
        tvdbId: undefined,
      },
    ],
    shows: [
      { imdbId: "tt0944947", tvdbId: "121361" },
      { imdbId: undefined, tvdbId: undefined },
    ],
  });
  expect(requests).toStrictEqual([
    { list: "user/list", offset: "0", apiKey: "mock-api-key" },
  ]);
});

it("combines the items of every list without duplicates", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    listItemsHandler({
      "user/first": {
        movies: [movie(1, { tmdb: 1 }), movie(2, { tmdb: 2 })],
        shows: [show(10, { tvdbId: 10 })],
      },
      "user/second": {
        movies: [movie(2, { tmdb: 2 }), movie(3, { tmdb: 3 })],
        shows: [show(10, { tvdbId: 10 }), show(11, { tvdbId: 11 })],
      },
    }),
  );

  const { movies, shows } = await dataSourceMap
    .get(MdblistAPI)
    .getListItems(new Set(["user/first", "user/second"]));

  expect(movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["1", "2", "3"]);
  expect(shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["10", "11"]);
});

it("only returns items that were not returned by an earlier request", async ({
  server,
  dataSourceMap,
}) => {
  const lists: Record<string, ListItemsResponse> = {
    "user/list": {
      movies: [movie(1, { tmdb: 1 })],
      shows: [show(10, { tvdbId: 10 })],
    },
  };

  server.use(listItemsHandler(lists));

  const api = dataSourceMap.get(MdblistAPI);
  const firstItems = await api.getListItems(new Set(["user/list"]));

  lists["user/list"] = {
    movies: [movie(1, { tmdb: 1 }), movie(2, { tmdb: 2 })],
    shows: [show(10, { tvdbId: 10 }), show(11, { tvdbId: 11 })],
  };

  const secondItems = await api.getListItems(new Set(["user/list"]));

  expect(firstItems.movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["1"]);
  expect(firstItems.shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["10"]);
  expect(secondItems.movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["2"]);
  expect(secondItems.shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["11"]);
});

it("requests the following pages from the offset of the items received so far", async ({
  server,
  dataSourceMap,
}) => {
  const offsets: (string | null)[] = [];
  const pages: Record<string, ListItemsResponse> = {
    "0": {
      movies: [movie(1, { tmdb: 1 }), movie(2, { tmdb: 2 })],
      shows: [show(10, { tvdbId: 10 })],
    },
    "3": { movies: [movie(3, { tmdb: 3 })], shows: [] },
    "4": { shows: [show(11, { tvdbId: 11 })] },
  };

  server.use(
    http.get(
      "https://api.mdblist.com/lists/:username/:listname/items",
      ({ request }) => {
        const offset = new URL(request.url).searchParams.get("offset");

        offsets.push(offset);

        return HttpResponse.json(pages[offset ?? ""], {
          headers: { "X-Has-More": offset === "4" ? "false" : "true" },
        });
      },
    ),
  );

  const { movies, shows } = await dataSourceMap
    .get(MdblistAPI)
    .getListItems(new Set(["user/list"]));

  expect(offsets).toStrictEqual(["0", "3", "4"]);
  expect(movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["1", "2", "3"]);
  expect(shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["10", "11"]);
});

it("ignores items without an MDBList ID", async ({ server, dataSourceMap }) => {
  server.use(
    listItemsHandler({
      "user/list": {
        movies: [movie(0, { tmdb: 100 }), movie(1, { tmdb: 1 })],
        shows: [show(0, { tvdbId: 100 }), show(10, { tvdbId: 10 })],
      },
    }),
  );

  const { movies, shows } = await dataSourceMap
    .get(MdblistAPI)
    .getListItems(new Set(["user/list"]));

  expect(movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["1"]);
  expect(shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["10"]);
});

it("rejects when a list cannot be fetched", async ({
  server,
  dataSourceMap,
}) => {
  server.use(listItemsHandler({}));

  await expect(
    dataSourceMap.get(MdblistAPI).getListItems(new Set(["user/missing"])),
  ).rejects.toThrow("404 Not Found");
});

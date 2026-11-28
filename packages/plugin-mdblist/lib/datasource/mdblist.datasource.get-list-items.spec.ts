import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it as baseIt } from "../__tests__/mdblist.test-context.ts";
import { MdblistAPI } from "./mdblist.datasource.ts";

import type { GetListItemsByName200Schema as ListItemsResponse } from "../__generated__/zod/getListItemsByNameSchema.ts";

type Movie = NonNullable<ListItemsResponse["movies"]>[number];

type Show = NonNullable<ListItemsResponse["shows"]>[number];

const LIST_ITEMS_URL =
  "https://api.mdblist.com/lists/:username/:listname/items";

const isAuthorized = (request: Request) =>
  new URL(request.url).searchParams.get("apikey") === "mock-api-key";

const it = baseIt
  .extend("movie", () => (id: number, ids: Movie["ids"] = {}): Movie => ({
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
  }))
  .extend(
    "show",
    () =>
      (
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
      }),
  )
  .extend(
    "listItemsHandler",
    () =>
      (
        lists: Record<string, ListItemsResponse>,
        requestedLists: string[] = [],
      ) =>
        http.get(LIST_ITEMS_URL, ({ params, request }) => {
          const list = `${String(params["username"])}/${String(params["listname"])}`;

          requestedLists.push(list);

          if (!isAuthorized(request)) {
            return HttpResponse.json(null, { status: 401 });
          }

          const items =
            new URL(request.url).searchParams.get("offset") === "0"
              ? lists[list]
              : undefined;

          if (!items) {
            return HttpResponse.json(null, { status: 404 });
          }

          return HttpResponse.json(items, {
            headers: { "X-Has-More": "false" },
          });
        }),
  );

it("returns no items without requesting anything when no lists are given", async ({
  dataSourceMap,
}) => {
  const items = await dataSourceMap.get(MdblistAPI).getListItems(new Set());

  expect(items).toStrictEqual({ movies: [], shows: [] });
});

it.for(["no-slash", "too/many/slashes", "/missing-user", "missing-list/"])(
  'rejects the invalid list name "%s" before requesting any list',
  async (listName, { listItemsHandler, server, dataSourceMap }) => {
    const requestedLists: string[] = [];

    server.use(listItemsHandler({}, requestedLists));

    await expect(
      dataSourceMap
        .get(MdblistAPI)
        .getListItems(new Set(["user/valid", listName])),
    ).rejects.toThrow(
      `${listName} is not a valid MDBList name, format has to be "<string>/<string>"`,
    );

    expect(requestedLists).toStrictEqual([]);
  },
);

it("maps the external IDs of movies and shows", async ({
  movie,
  show,
  listItemsHandler,
  server,
  dataSourceMap,
}) => {
  server.use(
    listItemsHandler({
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
    }),
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
});

it("combines the items of every list without duplicates", async ({
  movie,
  show,
  listItemsHandler,
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
  movie,
  show,
  listItemsHandler,
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
  movie,
  show,
  server,
  dataSourceMap,
}) => {
  const pages: Record<string, ListItemsResponse> = {
    "0": {
      movies: [movie(1, { tmdb: 1 }), movie(2, { tmdb: 2 })],
      shows: [show(10, { tvdbId: 10 })],
    },
    "3": { movies: [movie(3, { tmdb: 3 })], shows: [] },
    "4": { shows: [show(11, { tvdbId: 11 })] },
  };

  server.use(
    http.get(LIST_ITEMS_URL, ({ request }) => {
      const offset = new URL(request.url).searchParams.get("offset") ?? "";
      const page = pages[offset];

      if (!isAuthorized(request) || !page) {
        return HttpResponse.json(null, { status: 404 });
      }

      return HttpResponse.json(page, {
        headers: { "X-Has-More": offset === "4" ? "false" : "true" },
      });
    }),
  );

  const { movies, shows } = await dataSourceMap
    .get(MdblistAPI)
    .getListItems(new Set(["user/list"]));

  expect(movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(["1", "2", "3"]);
  expect(shows.map(({ tvdbId }) => tvdbId)).toStrictEqual(["10", "11"]);
});

it("ignores items without an MDBList ID", async ({
  movie,
  show,
  listItemsHandler,
  server,
  dataSourceMap,
}) => {
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
  listItemsHandler,
  server,
  dataSourceMap,
}) => {
  server.use(listItemsHandler({}));

  await expect(
    dataSourceMap.get(MdblistAPI).getListItems(new Set(["user/missing"])),
  ).rejects.toThrow("404 Not Found");
});

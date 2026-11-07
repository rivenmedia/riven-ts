import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./plex.test-context.ts";

import type { SetupServer } from "msw/node";

const librarySectionsResponse = {
  MediaContainer: {
    Directory: [
      {
        key: "1",
        Location: [{ id: 1, path: "plex-library-path/movies" }],
      },
      {
        key: "2",
        Location: [{ id: 2, path: "plex-library-path/shows" }],
      },
    ],
  },
};

const alienPath = "plex-library-path/movies/Alien (1979) {tmdb-348}";

const itemLocations: Record<string, object> = {
  "1": {
    Location: [
      { path: "plex-library-path/shows/Death Note (2006) {tvdb-79481}" },
    ],
  },
  "2": {
    Media: [{ Part: [{ file: `${alienPath}/Alien (1979) {tmdb-348}.mkv` }] }],
  },
  "3": {
    Media: [
      {
        Part: [
          {
            file: "plex-library-path/movies/Aliens (1986) {tmdb-679}/Aliens (1986) {tmdb-679}.mkv",
          },
        ],
      },
    ],
  },
  "4": {
    Media: [
      { Part: [{ file: `${alienPath}/Alien (1979) {tmdb-348}.mkv` }] },
      { Part: [{ file: "/other-library/Alien (1979)/Alien (1979).mkv" }] },
    ],
  },
};

function usePlexServer(
  server: SetupServer,
  {
    ratingKeys,
    deleteStatus = 200,
  }: { ratingKeys: string[]; deleteStatus?: number },
) {
  const deletedRatingKeys: string[] = [];
  const refreshedPaths: (string | null)[] = [];

  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json(librarySectionsResponse),
    ),
    http.get("**/library/sections/:sectionId/all", () =>
      HttpResponse.json({
        MediaContainer: {
          Metadata: ratingKeys.map((ratingKey) => ({ ratingKey })),
        },
      }),
    ),
    http.get("**/library/metadata/:ratingKey", ({ params }) =>
      HttpResponse.json({
        MediaContainer: {
          Metadata: [
            {
              ratingKey: params["ratingKey"],
              ...itemLocations[String(params["ratingKey"])],
            },
          ],
        },
      }),
    ),
    http.delete("**/library/metadata/:ratingKey", ({ params }) => {
      deletedRatingKeys.push(String(params["ratingKey"]));

      return new HttpResponse(null, { status: deleteStatus });
    }),
    http.post("**/library/sections/:sectionId/refresh", ({ request }) => {
      refreshedPaths.push(new URL(request.url).searchParams.get("path"));

      return new HttpResponse(null, { status: 200 });
    }),
  );

  return { deletedRatingKeys, refreshedPaths };
}

it("deletes the item stored in the removed path", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const { deletedRatingKeys, refreshedPaths } = usePlexServer(server, {
    ratingKeys: ["1"],
  });

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Death Note",
      paths: ["shows/Death Note (2006) {tvdb-79481}"],
    },
  });

  expect(deletedRatingKeys).toStrictEqual(["1"]);
  expect(refreshedPaths).toStrictEqual([]);
});

it("only deletes items that are stored entirely within the removed path", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const { deletedRatingKeys } = usePlexServer(server, {
    ratingKeys: ["2", "3", "4"],
  });

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Alien",
      paths: ["movies/Alien (1979) {tmdb-348}"],
    },
  });

  expect(deletedRatingKeys).toStrictEqual(["2"]);
});

it("refreshes the removed path if no item matches", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const { deletedRatingKeys, refreshedPaths } = usePlexServer(server, {
    ratingKeys: [],
  });

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Alien",
      paths: ["movies/Alien (1979) {tmdb-348}"],
    },
  });

  expect(deletedRatingKeys).toStrictEqual([]);
  expect(refreshedPaths).toStrictEqual([alienPath]);
});

it("refreshes the removed path if the item cannot be deleted", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const { refreshedPaths } = usePlexServer(server, {
    ratingKeys: ["2"],
    deleteStatus: 403,
  });

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Alien",
      paths: ["movies/Alien (1979) {tmdb-348}"],
    },
  });

  expect(refreshedPaths).toStrictEqual([alienPath]);
});

it("throws an error if no library section matches a removed path", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({ MediaContainer: { Directory: [] } }),
    ),
  );

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await expect(
    mediaItemRemovedHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: {
        title: "Inception",
        paths: ["movies/Inception (2010) {tmdb-27205}"],
      },
    }),
  ).rejects.toThrow("Failed to update library sections for Inception");
});

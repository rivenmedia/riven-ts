import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./plex.test-context.ts";

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

it("refreshes the library section of each removed path", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const refreshedPaths: { sectionId: string; path: string | null }[] = [];

  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json(librarySectionsResponse),
    ),
    http.post(
      "**/library/sections/:sectionId/refresh",
      ({ params, request }) => {
        refreshedPaths.push({
          sectionId: String(params["sectionId"]),
          path: new URL(request.url).searchParams.get("path"),
        });

        return new HttpResponse(null, { status: 200 });
      },
    ),
  );

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Breaking Bad and Death Note",
      paths: [
        "shows/Breaking Bad (2008) {tvdb-81189}",
        "shows/Death Note (2006) {tvdb-79481}",
      ],
    },
  });

  expect(refreshedPaths).toStrictEqual([
    {
      sectionId: "2",
      path: "plex-library-path/shows/Breaking Bad (2008) {tvdb-81189}",
    },
    {
      sectionId: "2",
      path: "plex-library-path/shows/Death Note (2006) {tvdb-79481}",
    },
  ]);
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

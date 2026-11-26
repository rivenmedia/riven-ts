import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./jellyfin.test-context.ts";

const itemsResponse = {
  Items: [
    {
      Id: "inception",
      Path: "/mount/movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv",
    },
    {
      Id: "breaking-bad",
      Path: "/mount/shows/Breaking Bad (2008) {tvdb-81189}",
    },
    {
      Id: "interstellar",
      Path: "/mount/movies/Interstellar (2014) {tmdb-157336}/Interstellar (2014) {tmdb-157336}.mkv",
    },
    {
      Id: "collection",
      Path: null,
    },
  ],
};

it("deletes the items located in the removed paths", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const deletedItemIds: string[] = [];

  server.use(
    http.get("**/Items", () => HttpResponse.json(itemsResponse)),
    http.delete("**/Items/:itemId", ({ params }) => {
      deletedItemIds.push(String(params["itemId"]));

      return new HttpResponse(null, { status: 204 });
    }),
  );

  const mediaItemRemovedHook = plugin.hooks["riven.media-item.removed"];

  expect.assert(mediaItemRemovedHook);

  await mediaItemRemovedHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      title: "Inception and Breaking Bad",
      paths: [
        "movies/Inception (2010) {tmdb-27205}",
        "shows/Breaking Bad (2008) {tvdb-81189}",
      ],
    },
  });

  expect(deletedItemIds.toSorted()).toStrictEqual([
    "breaking-bad",
    "inception",
  ]);
});

it("throws an error if an item cannot be deleted", async ({
  server,
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  server.use(
    http.get("**/Items", () => HttpResponse.json(itemsResponse)),
    http.delete("**/Items/:itemId", () =>
      HttpResponse.json({}, { status: 500 }),
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
  ).rejects.toThrow("Failed to delete item inception");
});

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./jellyfin.test-context.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const createItem = (
  entries: { baseDirectory: "movies" | "shows"; path: string }[],
) =>
  ({
    id: "00000000-0000-4000-8000-000000000001",
    fullTitle: "Test Item",
    getMediaEntries: async () => Promise.resolve(entries),
  }) as unknown as MediaItem;

const UPDATED_URL = "http://localhost:8096/Library/Media/Updated";

it("notifies Jellyfin of each downloaded folder once", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const requests: { body: unknown; authorization: string | null }[] = [];

  server.use(
    http.post(UPDATED_URL, async ({ request }) => {
      requests.push({
        body: await request.json(),
        authorization: request.headers.get("authorization"),
      });

      return new HttpResponse(null, { status: 204 });
    }),
  );

  await downloadSuccessHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      item: createItem([
        { baseDirectory: "shows", path: "Show/Season 01/Show S01E01.mkv" },
        { baseDirectory: "shows", path: "Show/Season 01/Show S01E02.mkv" },
        { baseDirectory: "shows", path: "Show/Season 02/Show S02E01.mkv" },
      ]),
    } as never,
  });

  expect(requests).toStrictEqual([
    {
      body: {
        Updates: [
          {
            Path: "/mount/shows/Show/Season 01",
            UpdateType: "Created",
          },
          {
            Path: "/mount/shows/Show/Season 02",
            UpdateType: "Created",
          },
        ],
      },
      authorization: "MediaBrowser Client=Riven, Token=test-token",
    },
  ]);
});

it("rejects when Jellyfin fails to update the library", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  server.use(
    http.post(UPDATED_URL, () => new HttpResponse(null, { status: 500 })),
  );

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: {
        item: createItem([
          { baseDirectory: "movies", path: "Movie (2020)/Movie (2020).mkv" },
        ]),
      } as never,
    }),
  ).rejects.toThrow(
    "Failed to refresh library section for paths: movies/Movie (2020).",
  );
});

it("rejects when the item has no media entries", async ({
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: { item: createItem([]) } as never,
    }),
  ).rejects.toThrow(
    "No media filesystem entry found for media item ID 00000000-0000-4000-8000-000000000001",
  );
});

import { createMockMediaItem } from "@repo/util-plugin-testing/create-mock-media-item";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./plex.test-context.ts";

import type { LibrarySectionsResponse } from "../schemas/library-sections-response.schema.ts";

const sections = (...locations: [key: string, path: string][]) =>
  http.get("http://localhost:32400/library/sections", () =>
    HttpResponse.json<LibrarySectionsResponse>({
      MediaContainer: {
        Directory: locations.map(([key, locationPath]) => ({
          key,
          Location: [{ id: Number(key), path: locationPath }],
        })),
      },
    }),
  );

it("refreshes the library section containing each downloaded folder", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const refreshes: {
    key: string;
    path: string | null;
    token: string | null;
  }[] = [];

  server.use(
    sections(
      ["1", "plex-library-path/movies"],
      ["2", "plex-library-path/shows"],
    ),
    http.post(
      "http://localhost:32400/library/sections/:key/refresh",
      ({ params, request }) => {
        refreshes.push({
          key: String(params["key"]),
          path: new URL(request.url).searchParams.get("path"),
          token: request.headers.get("x-plex-token"),
        });

        return HttpResponse.json({});
      },
    ),
  );

  await downloadSuccessHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      item: createMockMediaItem([
        { baseDirectory: "shows", path: "Show/Season 01/Show S01E01.mkv" },
        { baseDirectory: "shows", path: "Show/Season 01/Show S01E02.mkv" },
        { baseDirectory: "shows", path: "Show/Season 02/Show S02E01.mkv" },
      ]),
    } as never,
  });

  expect(refreshes).toStrictEqual([
    {
      key: "2",
      path: "plex-library-path/shows/Show/Season 01",
      token: "plex-token",
    },
    {
      key: "2",
      path: "plex-library-path/shows/Show/Season 02",
      token: "plex-token",
    },
  ]);
});

it("does not refresh a section whose location only shares a prefix with the folder", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const refreshedKeys: string[] = [];

  server.use(
    sections(["1", "plex-library-path/show"], ["2", "plex-library-path/shows"]),
    http.post(
      "http://localhost:32400/library/sections/:key/refresh",
      ({ params }) => {
        refreshedKeys.push(String(params["key"]));

        return HttpResponse.json({});
      },
    ),
  );

  await downloadSuccessHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      item: createMockMediaItem([
        { baseDirectory: "shows", path: "Show/Season 01/Show S01E01.mkv" },
      ]),
    } as never,
  });

  expect(refreshedKeys).toStrictEqual(["2"]);
});

it("refreshes a section for a folder whose name starts with two dots", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const refreshedKeys: string[] = [];

  server.use(
    sections(["2", "plex-library-path/shows"]),
    http.post(
      "http://localhost:32400/library/sections/:key/refresh",
      ({ params }) => {
        refreshedKeys.push(String(params["key"]));

        return HttpResponse.json({});
      },
    ),
  );

  await downloadSuccessHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: {
      item: createMockMediaItem([
        { baseDirectory: "shows", path: "..Show/Season 01/E.mkv" },
      ]),
    } as never,
  });

  expect(refreshedKeys).toStrictEqual(["2"]);
});

it("rejects when a folder is not in any library section", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  server.use(sections(["1", "plex-library-path/movies"]));

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: {
        item: createMockMediaItem([
          { baseDirectory: "shows", path: "Show/Season 01/E.mkv" },
        ]),
      } as never,
    }),
  ).rejects.toThrow(
    "Failed to update library sections for Test Item. No matching library section found for path: shows/Show/Season 01",
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
      event: { item: createMockMediaItem([]) } as never,
    }),
  ).rejects.toThrow(
    "No media filesystem entry found for media item ID 00000000-0000-4000-8000-000000000001",
  );
});

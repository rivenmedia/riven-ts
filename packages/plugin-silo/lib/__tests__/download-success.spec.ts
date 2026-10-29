import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "./silo.test-context.ts";

import type { MediaItemDownloadSuccessEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.success.event";

interface MockMediaEntry {
  baseDirectory: string;
  path: string;
}

const createEvent = (mediaEntries: MockMediaEntry[]) =>
  ({
    item: {
      id: 1,
      fullTitle: "Test Show - Season 1",
      getMediaEntries: vi
        .fn<() => Promise<MockMediaEntry[]>>()
        .mockResolvedValue(mediaEntries),
    },
    downloader: "@repo/plugin-test",
    durationMs: 0,
    provider: null,
  }) as unknown as MediaItemDownloadSuccessEvent;

it("requests a single scan per directory", async ({
  dataSourceMap,
  logger,
  plugin,
  server,
  settings,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const scannedPaths: unknown[] = [];

  server.use(
    http.post("**/api/v2/scan", async ({ request }) => {
      scannedPaths.push(await request.json());

      return HttpResponse.json(
        { status: "accepted", mode: "subtree", library_id: "1" },
        { status: 202 },
      );
    }),
  );

  await downloadSuccessHook({
    dataSources: dataSourceMap,
    settings,
    logger,
    event: createEvent([
      { baseDirectory: "shows", path: "Test Show/Season 01/S01E01.mkv" },
      { baseDirectory: "shows", path: "Test Show/Season 01/S01E02.mkv" },
    ]),
  });

  expect(scannedPaths).toStrictEqual([
    { path: "/mount/shows/Test Show/Season 01" },
  ]);
});

it("throws if the media item has no media entries", async ({
  dataSourceMap,
  logger,
  plugin,
  settings,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: createEvent([]),
    }),
  ).rejects.toThrow("No media filesystem entry found for media item ID 1");
});

it("throws an aggregated error if any scan fails", async ({
  dataSourceMap,
  logger,
  plugin,
  server,
  settings,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  server.use(
    http.post("**/api/v2/scan", async ({ request }) => {
      const body = (await request.json()) as { path: string };

      if (body.path.includes("Season 02")) {
        return HttpResponse.json({}, { status: 400 });
      }

      return HttpResponse.json(
        { status: "accepted", mode: "subtree", library_id: "1" },
        { status: 202 },
      );
    }),
  );

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: createEvent([
        { baseDirectory: "shows", path: "Test Show/Season 01/S01E01.mkv" },
        { baseDirectory: "shows", path: "Test Show/Season 02/S02E01.mkv" },
      ]),
    }),
  ).rejects.toThrow(
    "Failed to scan Silo library paths for Test Show - Season 1. Failed to scan /mount/shows/Test Show/Season 02",
  );
});

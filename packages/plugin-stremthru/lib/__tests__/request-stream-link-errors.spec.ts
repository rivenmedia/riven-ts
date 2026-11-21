import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

const createEntry = (entry: Partial<MediaEntry>) =>
  Object.assign(new MediaEntry(), {
    id: "00000000-0000-4000-8000-000000000001",
    ...entry,
  });

it.for([
  {
    scenario: "a direct link entry has no provider download ID",
    entry: { provider: "premiumize", originalFilename: "movie.mkv" },
    files: [],
    error:
      "Failed to generate link from premiumize: Media entry 00000000-0000-4000-8000-000000000001 does not have a provider download ID",
  },
  {
    scenario: "the file is not in the torrent",
    entry: {
      provider: "premiumize",
      providerDownloadId: "torrent-id",
      originalFilename: "movie.mkv",
    },
    files: [{ name: "other.mkv", path: "/other.mkv", size: 1 }],
    error:
      "Failed to generate link from premiumize: File movie.mkv not found in torrent torrent-id on store premiumize",
  },
  {
    scenario: "the file has no link",
    entry: {
      provider: "premiumize",
      providerDownloadId: "torrent-id",
      originalFilename: "movie.mkv",
    },
    files: [{ name: "movie.mkv", path: "/movie.mkv", size: 1 }],
    error:
      "Failed to generate link from premiumize: File movie.mkv in torrent torrent-id on store premiumize does not have a download link",
  },
  {
    scenario: "a generated link entry has no download URL",
    entry: { provider: "realdebrid", originalFilename: "movie.mkv" },
    files: [],
    error:
      "Failed to generate link from realdebrid: Media entry 00000000-0000-4000-8000-000000000001 does not have a download URL",
  },
])(
  "rejects when $scenario",
  async (
    { entry, files, error },
    { server, plugin, settings, logger, dataSourceMap },
  ) => {
    const requestStreamLinkHook =
      plugin.hooks["riven.media-item.stream-link.requested"];

    expect.assert(requestStreamLinkHook);

    server.use(
      http.get("**/v0/store/torz/:id", () =>
        HttpResponse.json({ data: { id: "torrent-id", files } }),
      ),
    );

    await expect(
      requestStreamLinkHook({
        dataSources: dataSourceMap,
        event: { item: createEntry(entry) },
        logger,
        settings,
      }),
    ).rejects.toThrow(error);
  },
);

it("rejects when the torrent cannot be found on the store", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  server.use(
    http.get("**/v0/store/torz/:id", () => HttpResponse.json({ data: null })),
  );

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: {
        item: createEntry({
          provider: "premiumize",
          providerDownloadId: "torrent-id",
          originalFilename: "movie.mkv",
        }),
      },
      logger,
      settings,
    }),
  ).rejects.toThrow(
    "Failed to generate link from premiumize: No data returned from premiumize for torrent torrent-id",
  );
});

it("rejects entries from an unknown provider", async ({
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: { item: createEntry({ provider: "unknown-store" }) },
      logger,
      settings,
    }),
  ).rejects.toThrow(/received \\"unknown-store\\"/u);
});

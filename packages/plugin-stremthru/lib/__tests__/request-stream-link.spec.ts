import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

import type { PathParams } from "msw";

it("returns the status code from the downstream response for errors", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json(null, { status: 451 }),
    ),
  );

  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    success: false,
    statusCode: 451,
  });
});

it(`returns a ${StatusCodes.GONE.toString()} status code when the entry's provider is no longer present in the config`, async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const streamLink = "http://example.com/stream-link";

  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: streamLink,
        },
      }),
    ),
  );

  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "torbox";

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    success: false,
    statusCode: StatusCodes.GONE,
  });
});

it("re-throws unexpected errors", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: null,
      }),
    ),
  );

  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger,
      settings,
    }),
  ).rejects.toThrow("Failed to generate link from realdebrid");
});

it("generates the link from the provider download id for stores that do not provide a direct link", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  const freshLink = "https://example.com/fresh-file-link";

  server.use(
    http.post<PathParams, { link: string }>(
      "**/v0/store/torz/link/generate",
      () =>
        HttpResponse.json({
          data: {
            link: freshLink,
          },
        }),
    ),
  );

  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  const item = new MediaEntry();

  item.providerDownloadId = "realdebrid:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.downloadUrl = "https://example.com/stale-download-link";
  item.provider = "realdebrid";

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: { item },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    success: true,
    data: {
      link: freshLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

it("provides the link from the torrent files for stores that provide direct CDN links", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  const correctLink = "https://example.com/correct-file-link";
  const originalFilename = "the-movie.mkv";

  server.use(
    http.get("**/v0/store/torz/:id", () =>
      HttpResponse.json({
        data: {
          id: "premiumize:cached:magnet:hash",
          status: "cached",
          files: [
            {
              name: "wrong-file.mkv",
              path: "/release/big-the-movie.mkv",
              link: "https://example.com/wrong-file-link",
              size: 500,
            },
            {
              name: originalFilename,
              path: "/release/the-movie.mkv",
              link: correctLink,
              size: 1000,
            },
          ],
        },
      }),
    ),
  );

  const requestStreamLinkHook =
    plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(requestStreamLinkHook);

  const item = new MediaEntry();

  item.providerDownloadId = "premiumize:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.provider = "premiumize";

  await expect(
    requestStreamLinkHook({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    success: true,
    data: {
      link: correctLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

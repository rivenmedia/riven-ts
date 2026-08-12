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

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
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

it("returns the stream link when the response is successful", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
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

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
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
      link: streamLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
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

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "torbox";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
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

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger,
      settings,
    }),
  ).rejects.toThrow("Failed to generate link from realdebrid");
});

it("regenerates the link from the provider download id for stores that do not provide a direct link", async ({
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

  const hook = plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(hook);

  const item = new MediaEntry();

  item.providerDownloadId = "realdebrid:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.downloadUrl = "https://example.com/stale-download-link";
  item.provider = "realdebrid";

  await expect(
    hook({
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

it("provides the link from the torrent directly for stores that provide direct CDN links", async ({
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

  const hook = plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(hook);

  const item = new MediaEntry();

  item.providerDownloadId = "premiumize:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.provider = "premiumize";

  await expect(
    hook({
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

it("resolves stremthru:// locked-link placeholders through link generation", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  // Some stores (e.g. torbox) return an unresolved locked-link placeholder
  // from GET torz/{id}; only link/generate turns it into a real CDN URL.
  const lockedLink = "stremthru://store/torbox/NjE2NDY2NTk6MA==";
  const resolvedLink = "https://cdn.example.com/dld/some-file?token=abc";

  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: resolvedLink,
        },
      }),
    ),
  );

  const hook = plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(hook);

  const item = new MediaEntry();

  item.downloadUrl = lockedLink;
  item.providerDownloadId = "61646659";
  item.originalFilename = "the-movie.mkv";
  item.provider = "realdebrid";

  await expect(
    hook({
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
      link: resolvedLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

it("falls back to legacy link generation when the durable torrent lacks the file", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  const legacyLink = "https://example.com/legacy-generated-link";

  server.use(
    http.get("**/v0/store/torz/:id", () =>
      HttpResponse.json({
        data: {
          id: "realdebrid:cached:magnet:hash",
          status: "cached",
          files: [
            {
              name: "some-other-file.mkv",
              path: "/some-other-file.mkv",
              link: "https://example.com/other-link",
              size: 1000,
            },
          ],
        },
      }),
    ),
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: legacyLink,
        },
      }),
    ),
  );

  const hook = plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(hook);

  const item = new MediaEntry();

  item.providerDownloadId = "realdebrid:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    hook({
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
      link: legacyLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

it("uses the legacy link generation path for entries without a provider download id", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  const legacyLink = "https://example.com/legacy-generated-link";

  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: legacyLink,
        },
      }),
    ),
  );

  const hook = plugin.hooks["riven.media-item.stream-link.requested"];

  expect.assert(hook);

  const item = new MediaEntry();

  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    hook({
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
      link: legacyLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

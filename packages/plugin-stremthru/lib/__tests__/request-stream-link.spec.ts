import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

it("returns the status code from the downstream response for errors", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
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
      logger: {} as never,
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
      logger: {} as never,
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
      logger: {} as never,
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
      logger: {} as never,
      settings,
    }),
  ).rejects.toThrow("Failed to generate link from realdebrid");
});

it("regenerates the link from the durable provider download id", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
}) => {
  const freshLink = "https://example.com/fresh-file-link";

  // No handler for link/generate: because `onUnhandledRequest` is "error",
  // the test fails if the legacy link-generation path is hit.
  server.use(
    http.get("**/v0/store/torz/:id", () =>
      HttpResponse.json({
        data: {
          id: "realdebrid:cached:magnet:hash",
          status: "cached",
          files: [
            {
              name: "the-movie.mkv",
              path: "/the-movie.mkv",
              link: freshLink,
              size: 1000,
            },
          ],
        },
      }),
    ),
  );

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.providerDownloadId = "realdebrid:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger: { warn: () => undefined, debug: () => undefined } as never,
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

it("falls back to legacy link generation when the durable torrent lacks the file", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
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

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.providerDownloadId = "realdebrid:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.downloadUrl = "https://example.com/download-link";
  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.requested"]({
      dataSources: dataSourceMap,
      event: {
        item,
      },
      logger: { warn: () => undefined, debug: () => undefined } as never,
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
      logger: {} as never,
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

import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

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
  ).resolves.toEqual({
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
  ).resolves.toEqual({
    success: true,
    data: {
      link: streamLink,
    },
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

import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru-premiumize.test-context.ts";

it("skips link generation for direct-link stores like premiumize", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
}) => {
  const directLink = "https://premiumize.example.com/direct-file-link";

  // No link/generate handler is registered: onUnhandledRequest is "error",
  // so the test fails if the durable path wrongly pipes a direct-link store
  // through link/generate.
  server.use(
    http.get("**/v0/store/torz/:id", () =>
      HttpResponse.json({
        data: {
          id: "premiumize:cached:magnet:hash",
          status: "cached",
          files: [
            {
              name: "the-movie.mkv",
              path: "/the-movie.mkv",
              link: directLink,
              size: 1000,
            },
          ],
        },
      }),
    ),
  );

  expect.assert(plugin.hooks["riven.media-item.stream-link.requested"]);

  const item = new MediaEntry();

  item.providerDownloadId = "premiumize:cached:magnet:hash";
  item.originalFilename = "the-movie.mkv";
  item.provider = "premiumize";

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
      link: directLink,
      isPermalink: false,
      expiresAt: expect.any(String),
    },
  });
});

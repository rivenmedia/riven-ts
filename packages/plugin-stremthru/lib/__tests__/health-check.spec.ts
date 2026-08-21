import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { Store } from "../schemas/store.schema.ts";
import { storeExpiredLinkStatusCodes } from "../utilities/store-expired-link-status-codes.ts";
import { it } from "./stremthru.test-context.ts";

const link = "https://example.com/stream-link";

it.describe.for(Store.options)("store: %s", (store) => {
  const expiredLinkStatusCodes = storeExpiredLinkStatusCodes(store);

  it.for<StatusCodes>([...expiredLinkStatusCodes])(
    "classifies a %s response as an expired link",
    async (statusCode, { dataSourceMap, server, plugin, settings, logger }) => {
      server.use(
        http.head(link, () => new HttpResponse(null, { status: statusCode })),
      );

      const streamLinkHealthCheckRequestedHook =
        plugin.hooks["riven.media-item.stream-link.health-check.requested"];

      expect.assert(streamLinkHealthCheckRequestedHook);

      const item = new MediaEntry();

      item.provider = store;

      await expect(
        streamLinkHealthCheckRequestedHook({
          dataSources: dataSourceMap,
          event: {
            item,
            link,
          },
          logger,
          settings,
        }),
      ).resolves.toStrictEqual({
        state: "expired",
        statusCode,
      });
    },
  );

  it.for([
    StatusCodes.NOT_FOUND,
    StatusCodes.GONE,
    StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
  ])(
    "classifies a %s response as a dead link",
    async (statusCode, { dataSourceMap, server, plugin, settings, logger }) => {
      server.use(
        http.head(link, () => new HttpResponse(null, { status: statusCode })),
      );

      const streamLinkHealthCheckRequestedHook =
        plugin.hooks["riven.media-item.stream-link.health-check.requested"];

      expect.assert(streamLinkHealthCheckRequestedHook);

      const item = new MediaEntry();

      item.provider = store;

      await expect(
        streamLinkHealthCheckRequestedHook({
          dataSources: dataSourceMap,
          event: {
            item,
            link,
          },
          logger,
          settings,
        }),
      ).resolves.toStrictEqual({
        state: "dead",
        statusCode,
      });
    },
  );

  it.for([StatusCodes.OK, StatusCodes.PARTIAL_CONTENT])(
    "classifies a %s response as a healthy link",
    async (statusCode, { dataSourceMap, server, plugin, settings, logger }) => {
      server.use(
        http.head(link, () => new HttpResponse(null, { status: statusCode })),
      );

      const streamLinkHealthCheckRequestedHook =
        plugin.hooks["riven.media-item.stream-link.health-check.requested"];

      expect.assert(streamLinkHealthCheckRequestedHook);

      const item = new MediaEntry();

      item.provider = store;

      await expect(
        streamLinkHealthCheckRequestedHook({
          dataSources: dataSourceMap,
          event: {
            item,
            link,
          },
          logger,
          settings,
        }),
      ).resolves.toStrictEqual({
        state: "healthy",
        statusCode,
      });
    },
  );
});

it("does not classify a 403 response as expired for non-premiumize stores", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
  logger,
}) => {
  server.use(http.head(link, () => new HttpResponse(null, { status: 403 })));

  const streamLinkHealthCheckRequestedHook =
    plugin.hooks["riven.media-item.stream-link.health-check.requested"];

  expect.assert(streamLinkHealthCheckRequestedHook);

  const item = new MediaEntry();

  item.provider = "realdebrid";

  await expect(
    streamLinkHealthCheckRequestedHook({
      dataSources: dataSourceMap,
      event: {
        item,
        link,
      },
      logger,
      settings,
    }),
  ).rejects.toThrow(/status code 403/iu);
});

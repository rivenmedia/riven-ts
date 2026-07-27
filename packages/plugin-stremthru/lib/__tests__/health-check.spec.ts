import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

const link = "https://example.com/stream-link";

function storeUserHandler(subscriptionStatus: "premium" | "expired" | "trial") {
  return http.get("**/v0/store/user", () =>
    HttpResponse.json({
      data: {
        id: "user-id",
        email: "user@example.com",
        subscription_status: subscriptionStatus,
        has_usenet: false,
      },
    }),
  );
}

it("classifies a 403 response as an expired link when the subscription is active", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
}) => {
  server.use(
    http.head(link, () => new HttpResponse(null, { status: 403 })),
    // Active subscription => the 403 is a real expired-link signature.
    storeUserHandler("premium"),
  );

  expect.assert(
    plugin.hooks["riven.media-item.stream-link.health-check.requested"],
  );

  const item = new MediaEntry();

  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.health-check.requested"]({
      dataSources: dataSourceMap,
      event: {
        item,
        link,
      },
      logger: {} as never,
      settings,
    }),
  ).resolves.toStrictEqual({
    state: "expired",
    statusCode: StatusCodes.FORBIDDEN,
  });
});

it("throws instead of classifying a 403 as expired when the subscription has lapsed", async ({
  dataSourceMap,
  server,
  plugin,
  settings,
}) => {
  server.use(
    http.head(link, () => new HttpResponse(null, { status: 403 })),
    // Lapsed subscription => 403 is account-level, not a link signature.
    // Must NOT classify as expired (which would blacklist healthy torrents).
    storeUserHandler("expired"),
  );

  expect.assert(
    plugin.hooks["riven.media-item.stream-link.health-check.requested"],
  );

  const item = new MediaEntry();

  item.provider = "realdebrid";

  await expect(
    plugin.hooks["riven.media-item.stream-link.health-check.requested"]({
      dataSources: dataSourceMap,
      event: {
        item,
        link,
      },
      logger: {} as never,
      settings,
    }),
  ).rejects.toThrow(/subscription is expired/iu);
});

it.for([
  StatusCodes.NOT_FOUND,
  StatusCodes.GONE,
  StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
])(
  "classifies a %s response as a dead link",
  async (statusCode, { dataSourceMap, server, plugin, settings }) => {
    server.use(
      http.head(link, () => new HttpResponse(null, { status: statusCode })),
    );

    expect.assert(
      plugin.hooks["riven.media-item.stream-link.health-check.requested"],
    );

    const item = new MediaEntry();

    item.provider = "realdebrid";

    await expect(
      plugin.hooks["riven.media-item.stream-link.health-check.requested"]({
        dataSources: dataSourceMap,
        event: {
          item,
          link,
        },
        logger: {} as never,
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
  async (statusCode, { dataSourceMap, server, plugin, settings }) => {
    server.use(
      http.head(link, () => new HttpResponse(null, { status: statusCode })),
    );

    expect.assert(
      plugin.hooks["riven.media-item.stream-link.health-check.requested"],
    );

    const item = new MediaEntry();

    item.provider = "realdebrid";

    await expect(
      plugin.hooks["riven.media-item.stream-link.health-check.requested"]({
        dataSources: dataSourceMap,
        event: {
          item,
          link,
        },
        logger: {} as never,
        settings,
      }),
    ).resolves.toStrictEqual({
      state: "healthy",
      statusCode,
    });
  },
);

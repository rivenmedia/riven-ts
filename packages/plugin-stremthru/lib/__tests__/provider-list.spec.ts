import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { StremThruTorzAPI } from "../datasource/stremthru-torz.datasource.ts";
import { StremThruSettings } from "../stremthru-settings.schema.ts";
import { it } from "./stremthru.test-context.ts";

import type { StoreUserResponse } from "../schemas/store-user-response.schema.ts";

it.override(
  "settings",
  createMockPluginSettings(StremThruSettings, {
    realdebridApiKey: "test-realdebrid-api-key",
    alldebridApiKey: "test-alldebrid-api-key",
    debridlinkApiKey: "test-debridlink-api-key",
    storePriority: JSON.stringify(["debridlink", "alldebrid", "realdebrid"]),
  }),
);

it("returns providers in the order specified by settings", async ({
  server,
  plugin,
  settings,
  dataSourceMap,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.media-item.download.provider-list-requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          id: "test-user-id",
          email: "test-user@example.com",
          subscription_status: "premium",
          has_usenet: false,
        },
      }),
    ),
  );

  await dataSourceMap.get(StremThruTorzAPI).validate();

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger: {} as never,
  });

  expect(response).toEqual({
    providers: ["debridlink", "alldebrid", "realdebrid"],
    rateLimitedProviders: {},
  });
});

it("does not return invalid providers", async ({
  server,
  plugin,
  settings,
  dataSourceMap,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.media-item.download.provider-list-requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/v0/store/user", ({ request: { headers } }) => {
      const commonFields = {
        id: "test-user-id",
        email: "email@email.com",
        has_usenet: false,
      } as const satisfies Omit<
        StoreUserResponse["data"],
        "subscription_status"
      >;

      if (headers.get("x-stremthru-store-name") === "alldebrid") {
        return HttpResponse.json<StoreUserResponse>({
          data: {
            ...commonFields,
            subscription_status: "expired",
          },
        });
      }

      return HttpResponse.json<StoreUserResponse>({
        data: {
          ...commonFields,
          subscription_status: "premium",
        },
      });
    }),
  );

  await dataSourceMap.get(StremThruTorzAPI).validate();

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger: {} as never,
  });

  expect(response).toEqual({
    providers: ["debridlink", "realdebrid"],
    rateLimitedProviders: {},
  });
});

it("returns rate-limited providers in the rateLimitedProviders list", async ({
  server,
  plugin,
  settings,
  dataSourceMap,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.media-item.download.provider-list-requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          id: "test-user-id",
          email: "email@email.com",
          has_usenet: false,
          subscription_status: "premium",
        },
      }),
    ),
    http.post("**/v0/store/torz", () =>
      HttpResponse.json<StoreUserResponse>(null, {
        status: 429,
        headers: { "Retry-After": "60" },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await api.validate();

  try {
    await api.addTorrent("mock-info-hash", "realdebrid");
  } catch {
    /* empty */
  }

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger: {} as never,
  });

  expect(response).toEqual({
    providers: ["debridlink", "alldebrid"],
    rateLimitedProviders: {
      realdebrid: expect.any(Number),
    },
  });
});

it("moves rate-limited providers back to the providers list after the rate limit has passed", async ({
  server,
  plugin,
  settings,
  dataSourceMap,
}) => {
  vi.useFakeTimers();

  const providerListRequestedHook =
    plugin.hooks["riven.media-item.download.provider-list-requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          id: "test-user-id",
          email: "email@email.com",
          has_usenet: false,
          subscription_status: "premium",
        },
      }),
    ),
    http.post("**/v0/store/torz", () =>
      HttpResponse.json<StoreUserResponse>(null, {
        status: 429,
        headers: { "Retry-After": "1" },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await api.validate();

  try {
    await api.addTorrent("mock-info-hash", "realdebrid");
  } catch {
    /* empty */
  }

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger: {} as never,
  });

  expect(response).toEqual({
    providers: ["debridlink", "alldebrid"],
    rateLimitedProviders: {
      realdebrid: expect.any(Number),
    },
  });

  await vi.waitFor(
    async () => {
      const response = await providerListRequestedHook({
        dataSources: dataSourceMap,
        settings,
        event: {},
        logger: {} as never,
      });

      expect(response).toEqual({
        providers: ["debridlink", "alldebrid", "realdebrid"],
        rateLimitedProviders: {},
      });
    },
    { timeout: 2000 },
  );
});

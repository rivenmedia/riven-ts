import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { it } from "../../../__tests__/stremthru.test-context.ts";
import { Store } from "../../../schemas/store.schema.js";
import { StremThruSettings } from "../../../stremthru-settings.schema.ts";
import { StremThruTorzAPI } from "../../stremthru-torz.datasource.ts";

import type { StoreUserResponse } from "../../../schemas/store-user-response.schema.ts";

describe("when no stores are configured", () => {
  it.override("settings", createMockPluginSettings(StremThruSettings, {}));

  it("returns false", async ({ dataSourceMap }) => {
    const api = dataSourceMap.get(StremThruTorzAPI);
    const isValid = await api.validate();

    expect(isValid).toBe(false);
  });
});

it("returns false when all stores are invalid", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          email: "mock@email.com",
          id: "mock-id",
          subscription_status: "expired",
          has_usenet: false,
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const isValid = await api.validate();

  expect(isValid).toBe(false);
});

it("returns true when at least one store is valid", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/store/user", ({ request: { headers } }) => {
      const store = Store.parse(headers.get("x-stremthru-store-name"));
      const commonFields = {
        id: "test-user-id",
        email: "email@email.com",
        has_usenet: false,
      } as const satisfies Omit<
        StoreUserResponse["data"],
        "subscription_status"
      >;

      if (store === "realdebrid") {
        return HttpResponse.json<StoreUserResponse>({
          data: {
            ...commonFields,
            subscription_status: "premium",
          },
        });
      }

      return HttpResponse.json<StoreUserResponse>({
        data: {
          ...commonFields,
          subscription_status: "expired",
        },
      });
    }),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const isValid = await api.validate();

  expect(isValid).toBe(true);
});

it("clears previously valid stores when revalidating", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(
      "**/v0/store/user",
      () =>
        HttpResponse.json<StoreUserResponse>({
          data: {
            email: "mock@email.com",
            id: "mock-id",
            subscription_status: "premium",
            has_usenet: false,
          },
        }),
      { once: true },
    ),
    http.get(
      "**/v0/store/user",
      () =>
        HttpResponse.json<StoreUserResponse>({
          data: {
            email: "mock@email.com",
            id: "mock-id",
            subscription_status: "expired",
            has_usenet: false,
          },
        }),
      { once: true },
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await api.validate();

  expect(api.validStores.size).toBe(1);

  await api.validate();

  expect(api.validStores.size).toBe(0);
});

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/stremthru.test-context.ts";
import { Store } from "../schemas/store.schema.ts";
import { StremThruTorzAPI } from "./stremthru-torz.datasource.ts";

import type { StoreUserResponse } from "../schemas/store-user-response.schema.ts";

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
  let subscriptionStatus: StoreUserResponse["data"]["subscription_status"] =
    "premium";

  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          email: "mock@email.com",
          id: "mock-id",
          subscription_status: subscriptionStatus,
          has_usenet: false,
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.validate()).resolves.toBe(true);
  expect(api.validStores).toStrictEqual(new Set(["premiumize", "realdebrid"]));

  subscriptionStatus = "expired";

  await expect(api.validate()).resolves.toBe(false);
  expect(api.validStores).toStrictEqual(new Set());
});

it("accepts stores with a trial subscription", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/store/user", () =>
      HttpResponse.json<StoreUserResponse>({
        data: {
          email: "mock@email.com",
          id: "mock-id",
          subscription_status: "trial",
          has_usenet: false,
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.validate()).resolves.toBe(true);
  expect(api.validStores).toStrictEqual(new Set(["premiumize", "realdebrid"]));
});

it("rejects stores that return an unexpected response", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/store/user", ({ request }) =>
      request.headers.get("x-stremthru-store-name") === "realdebrid"
        ? HttpResponse.json({ data: { error: "unexpected" } })
        : HttpResponse.json<StoreUserResponse>({
            data: {
              email: "mock@email.com",
              id: "mock-id",
              subscription_status: "premium",
              has_usenet: false,
            },
          }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.validate()).resolves.toBe(true);
  expect(api.validStores).toStrictEqual(new Set(["premiumize"]));
});

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

import type { StoreUserResponse } from "../schemas/store-user-response.schema.ts";

const storeUser = (subscriptionStatus: "premium" | "expired") =>
  http.get("**/v0/store/user", () =>
    HttpResponse.json<StoreUserResponse>({
      data: {
        id: "test-user-id",
        email: "email@email.com",
        has_usenet: false,
        subscription_status: subscriptionStatus,
      },
    }),
  );

const torznab = (status: number) =>
  http.get("**/v0/torznab/api", () => HttpResponse.json({}, { status }));

it.for([
  {
    label: "a store is valid and Torznab is reachable",
    subscription: "premium",
    torznabStatus: 200,
    expected: true,
  },
  {
    label: "Torznab is unreachable",
    subscription: "premium",
    torznabStatus: 401,
    expected: false,
  },
  {
    label: "no store is valid",
    subscription: "expired",
    torznabStatus: 200,
    expected: false,
  },
] as const)(
  "is valid only when both APIs are valid: $label",
  async (
    { subscription, torznabStatus, expected },
    { dataSourceMap, plugin, server, settings },
  ) => {
    server.use(storeUser(subscription), torznab(torznabStatus));

    await expect(
      plugin.validator({ dataSources: dataSourceMap, settings }),
    ).resolves.toBe(expected);
  },
);

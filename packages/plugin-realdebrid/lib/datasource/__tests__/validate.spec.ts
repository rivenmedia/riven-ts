import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { RealDebridAPI } from "../realdebrid.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const realdebridApi = new RealDebridAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-realdebrid"),
    settings: {
      apiKey: "",
    },
  });
  const isValid = await realdebridApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const realdebridApi = new RealDebridAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-realdebrid"),
    settings: {
      apiKey: "",
    },
  });
  const isValid = await realdebridApi.validate();

  expect(isValid).toBe(true);
});

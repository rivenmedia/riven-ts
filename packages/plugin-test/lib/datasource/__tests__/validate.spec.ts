import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { TestAPI } from "../test.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const testApi = new TestAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-test"),
    settings: {},
  });
  const isValid = await testApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const testApi = new TestAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-test"),
    settings: {},
  });
  const isValid = await testApi.validate();

  expect(isValid).toBe(true);
});

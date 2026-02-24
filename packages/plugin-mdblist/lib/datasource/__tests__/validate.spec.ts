import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { pluginConfig } from "../../mdblist-plugin.config.ts";
import { MdblistAPI } from "../mdblist.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/user", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const mdblistApi = new MdblistAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: { apiKey: "test-api-key", lists: [] },
  });
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(http.get("**/user", () => HttpResponse.json({ success: true })));

  const mdblistApi = new MdblistAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: { apiKey: "test-api-key", lists: [] },
  });
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(true);
});

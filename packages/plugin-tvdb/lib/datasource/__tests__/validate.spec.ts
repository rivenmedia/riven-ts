import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { pluginConfig } from "../../tvdb-plugin.config.ts";
import { TvdbAPI } from "../tvdb.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const tvdbApi = new TvdbAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "",
    },
  });
  const isValid = await tvdbApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const tvdbApi = new TvdbAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "",
    },
  });
  const isValid = await tvdbApi.validate();

  expect(isValid).toBe(true);
});

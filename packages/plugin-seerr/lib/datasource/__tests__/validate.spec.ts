import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getAuthMeHandler } from "../../__generated__/index.ts";
import { pluginConfig } from "../../seerr-plugin.config.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

const testSettings = {
  apiKey: "test-api-key",
  url: "http://localhost:5055",
  filter: "approved",
};

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(getAuthMeHandler(() => HttpResponse.error()));

  const seerrApi = new SeerrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: testSettings,
  });
  const isValid = await seerrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(getAuthMeHandler());

  const seerrApi = new SeerrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: testSettings,
  });
  const isValid = await seerrApi.validate();

  expect(isValid).toBe(true);
});

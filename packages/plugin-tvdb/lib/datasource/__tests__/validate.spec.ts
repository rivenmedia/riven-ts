import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { expect } from "vitest";

import {
  postLoginHandler,
  postLoginHandlerResponse401,
} from "../../__generated__/index.ts";
import { pluginConfig } from "../../tvdb-plugin.config.ts";
import { TvdbAPI } from "../tvdb.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(postLoginHandler(postLoginHandlerResponse401));

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
  server.use(postLoginHandler({ data: { token: "mock-token" } }));

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

import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getApiListMyPageHandler } from "../../__generated__/index.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = new ListrrAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-listrr"),
    settings: {
      apiKey: "",
      movieLists: [],
      showLists: [],
    },
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(getApiListMyPageHandler());

  const listrrApi = new ListrrAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-listrr"),
    settings: {
      apiKey: "",
      movieLists: [],
      showLists: [],
    },
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

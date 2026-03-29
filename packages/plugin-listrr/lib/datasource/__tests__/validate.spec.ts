import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import {
  createGetApiListMyPageQueryResponse,
  getApiListMyPageHandler,
} from "../../__generated__/index.ts";
import { pluginConfig } from "../../listrr-plugin.config.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = new ListrrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
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
  server.use(
    getApiListMyPageHandler(() =>
      HttpResponse.json(createGetApiListMyPageQueryResponse()),
    ),
  );

  const listrrApi = new ListrrAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "",
      movieLists: [],
      showLists: [],
    },
  });

  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

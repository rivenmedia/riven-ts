import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getApiListMyPageHandler } from "../../__generated__/index.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it("returns false if the request fails", async ({
  server,
  httpCache,
  redisUrl,
}) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = new ListrrAPI({
    cache: httpCache,
    connection: {
      url: redisUrl,
    },
    logger: {} as never,
    settings: {
      apiKey: "",
      movieLists: [],
      showLists: [],
    },
    pluginSymbol: Symbol("@repo/plugin-listrr"),
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  httpCache,
  redisUrl,
}) => {
  server.use(getApiListMyPageHandler());

  const listrrApi = new ListrrAPI({
    cache: httpCache,
    connection: {
      url: redisUrl,
    },
    logger: {} as never,
    settings: {
      apiKey: "",
      movieLists: [],
      showLists: [],
    },
    pluginSymbol: Symbol("@repo/plugin-listrr"),
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

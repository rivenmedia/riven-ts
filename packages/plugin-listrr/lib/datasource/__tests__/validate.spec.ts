import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getApiListMyPageHandler } from "../../__generated__/index.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it("returns false if the request fails", async ({ server, httpCache }) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = new ListrrAPI({
    cache: httpCache,
    redisUrl: "redis-url",
    logger,
    pluginSymbol: Symbol("@repo/plugin-listrr"),
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server, httpCache }) => {
  server.use(getApiListMyPageHandler());

  const listrrApi = new ListrrAPI({
    cache: httpCache,
    redisUrl: "redis-url",
    logger,
    pluginSymbol: Symbol("@repo/plugin-listrr"),
  });
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

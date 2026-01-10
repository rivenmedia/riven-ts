import { logger } from "@repo/core-util-logger";
import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getMyLimitsHandler } from "../../__generated__/index.ts";
import { MDBListAPI } from "../mdblist.datasource.ts";

it("returns true if the current user is valid", async ({
  server,
  httpCache,
}) => {
  server.use(getMyLimitsHandler());

  const mdbListApi = new MDBListAPI({
    cache: httpCache,
    token: "test-token",
    redisUrl: "redis-url",
    logger,
    pluginSymbol: Symbol("@repo/plugin-mdblist"),
  });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(true);
});

it("returns false if the API token is missing", async ({ httpCache }) => {
  const mdbListApi = new MDBListAPI({
    cache: httpCache,
    token: undefined,
    redisUrl: "redis-url",
    logger,
    pluginSymbol: Symbol("@repo/plugin-mdblist"),
  });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(false);
});

it("returns false if the current user is invalid", async ({
  server,
  httpCache,
}) => {
  server.use(getMyLimitsHandler(() => HttpResponse.error()));

  const mdbListApi = new MDBListAPI({
    cache: httpCache,
    token: "test-token",
    redisUrl: "redis-url",
    logger,
    pluginSymbol: Symbol("@repo/plugin-mdblist"),
  });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(false);
});

import { getApiListMyPageHandler } from "./__generated__/index.ts";
import { ListrrAPI } from "./listrr.datasource.ts";
import { expect } from "vitest";
import { it } from "@repo/core-util-vitest-config/test-context";
import { HttpResponse } from "msw";

it("returns false if the request fails", async ({ server }) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = new ListrrAPI("1234");
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server }) => {
  server.use(getApiListMyPageHandler());

  const listrrApi = new ListrrAPI("1234");
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

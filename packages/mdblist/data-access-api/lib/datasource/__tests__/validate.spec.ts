import { getMyLimitsHandler } from "../../__generated__/index.ts";
import { MDBListAPI } from "../mdblist.datasource.ts";
import { HttpResponse } from "msw";
import { it } from "@repo/core-util-vitest-test-context";
import { expect } from "vitest";

it("returns true if the current user is valid", async ({ server }) => {
  server.use(getMyLimitsHandler());

  const mdbListApi = new MDBListAPI({ token: "test-token" });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(true);
});

it("returns false if the API token is missing", async () => {
  const mdbListApi = new MDBListAPI({ token: undefined });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(false);
});

it("returns false if the current user is invalid", async ({ server }) => {
  server.use(getMyLimitsHandler(() => HttpResponse.error()));

  const mdbListApi = new MDBListAPI({ token: "test-token" });
  const isValid = await mdbListApi.validate();

  expect(isValid).toBe(false);
});

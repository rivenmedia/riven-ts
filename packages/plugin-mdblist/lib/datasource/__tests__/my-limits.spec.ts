import { it } from "@repo/core-util-vitest-test-context";

import { expect } from "vitest";

import {
  createGetMyLimitsQueryResponse,
  getMyLimitsHandler,
} from "../../__generated__/index.ts";
import { MDBListAPI } from "../mdblist.datasource.ts";

it("returns the user's API limits", async ({ server }) => {
  const mockLimits = createGetMyLimitsQueryResponse();

  server.use(getMyLimitsHandler(mockLimits));

  const mdbListApi = new MDBListAPI({ token: "test-token" });
  const limits = await mdbListApi.myLimits();

  expect(limits).toEqual(mockLimits);
});

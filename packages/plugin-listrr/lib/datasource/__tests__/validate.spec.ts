import { HttpResponse } from "msw";
import { expect } from "vitest";

import {
  createGetApiListMyPageQueryResponse,
  getApiListMyPageHandler,
} from "../../__generated__/index.ts";
import { it } from "../../__tests__/listrr.test-context.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(getApiListMyPageHandler(() => HttpResponse.error()));

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    getApiListMyPageHandler(() =>
      HttpResponse.json(createGetApiListMyPageQueryResponse()),
    ),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const isValid = await listrrApi.validate();

  expect(isValid).toBe(true);
});

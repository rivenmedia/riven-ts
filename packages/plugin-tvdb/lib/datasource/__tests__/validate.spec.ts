import { expect } from "vitest";

import {
  postLoginHandler,
  postLoginHandlerResponse401,
} from "../../__generated__/index.ts";
import { it } from "../../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "../tvdb.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(postLoginHandler(postLoginHandlerResponse401));

  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const isValid = await tvdbApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(postLoginHandler({ data: { token: "mock-token" } }));

  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const isValid = await tvdbApi.validate();

  expect(isValid).toBe(true);
});

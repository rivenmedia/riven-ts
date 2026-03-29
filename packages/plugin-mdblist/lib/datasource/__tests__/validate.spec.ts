import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/mdblist.test-context.ts";
import { MdblistAPI } from "../mdblist.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/user", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const mdblistApi = dataSourceMap.get(MdblistAPI);
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(http.get("**/user", () => HttpResponse.json({ success: true })));

  const mdblistApi = dataSourceMap.get(MdblistAPI);
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(true);
});

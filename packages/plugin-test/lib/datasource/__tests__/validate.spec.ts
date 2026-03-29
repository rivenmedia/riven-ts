import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/test.test-context.ts";
import { TestAPI } from "../test.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const testApi = dataSourceMap.get(TestAPI);
  const isValid = await testApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const testApi = dataSourceMap.get(TestAPI);
  const isValid = await testApi.validate();

  expect(isValid).toBe(true);
});

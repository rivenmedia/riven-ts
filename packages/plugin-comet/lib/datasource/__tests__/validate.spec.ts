import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/comet.test-context.ts";
import { CometAPI } from "../comet.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const cometApi = dataSourceMap.get(CometAPI);
  const isValid = await cometApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const cometApi = dataSourceMap.get(CometAPI);
  const isValid = await cometApi.validate();

  expect(isValid).toBe(true);
});

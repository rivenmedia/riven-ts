import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/meteor.test-context.ts";
import { MeteorAPI } from "../meteor.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/manifest.json", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const meteorApi = dataSourceMap.get(MeteorAPI);
  const isValid = await meteorApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/manifest.json", () => HttpResponse.json({ success: true })),
  );

  const meteorApi = dataSourceMap.get(MeteorAPI);
  const isValid = await meteorApi.validate();

  expect(isValid).toBe(true);
});

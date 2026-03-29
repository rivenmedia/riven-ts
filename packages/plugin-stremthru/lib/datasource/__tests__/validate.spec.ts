import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/stremthru.test-context.ts";
import { StremThruAPI } from "../stremthru.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const stremThruApi = dataSourceMap.get(StremThruAPI);
  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () => HttpResponse.json({ success: true })),
  );

  const stremThruApi = dataSourceMap.get(StremThruAPI);
  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(true);
});

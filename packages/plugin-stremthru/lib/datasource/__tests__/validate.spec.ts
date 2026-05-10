import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/stremthru.test-context.ts";
import { StremThruTorzAPI } from "../stremthru-torz.datasource.ts";
import { StremThruTorznabAPI } from "../stremthru-torznab.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const stremThruApi = dataSourceMap.get(StremThruTorznabAPI);
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

  const stremThruApi = dataSourceMap.get(StremThruTorznabAPI);
  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(true);
});

it("torz validate returns false if the request fails", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const isValid = await api.validate();

  expect(isValid).toBe(false);
});

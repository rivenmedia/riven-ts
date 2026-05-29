import { DataSourceHTTPError } from "@repo/util-plugin-sdk";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../../__tests__/stremthru.test-context.ts";
import { StremThruTorzAPI } from "../../stremthru-torz.datasource.ts";

it('adds stores that hit rate limits to the "rateLimitedStores" set', async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json(null, { status: 429 }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  expect(api.rateLimitedStores.has("realdebrid")).toBe(false);

  await expect(api.addTorrent("mock-info-hash", "realdebrid")).rejects.toThrow(
    DataSourceHTTPError,
  );

  expect(api.rateLimitedStores.has("realdebrid")).toBe(true);
});

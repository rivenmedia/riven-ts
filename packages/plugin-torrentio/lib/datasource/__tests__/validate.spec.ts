import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/torrentio.test-context.ts";
import { TorrentioAPI } from "../torrentio.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const torrentioApi = dataSourceMap.get(TorrentioAPI);
  const isValid = await torrentioApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const torrentioApi = dataSourceMap.get(TorrentioAPI);
  const isValid = await torrentioApi.validate();

  expect(isValid).toBe(true);
});

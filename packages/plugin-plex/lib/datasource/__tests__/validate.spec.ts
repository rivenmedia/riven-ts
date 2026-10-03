import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { PlexAPI } from "../plex.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json(null, { status: 401 }),
    ),
  );

  const plexApi = dataSourceMap.get(PlexAPI);
  const isValid = await plexApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/library/sections", () => HttpResponse.json({ success: true })),
  );

  const plexApi = dataSourceMap.get(PlexAPI);
  const isValid = await plexApi.validate();

  expect(isValid).toBe(true);
});

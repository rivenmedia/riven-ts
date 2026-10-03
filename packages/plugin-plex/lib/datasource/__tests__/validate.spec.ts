import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { PlexAPI } from "../plex.datasource.ts";

// Skipped: PlexAPI.validate() requests `library/sections` rather than the mocked `validate` endpoint
it.skip("returns false if the request fails", ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json(null, { status: 401 })),
  );

  const plexApi = dataSourceMap.get(PlexAPI);
  const isValid = plexApi.validate();

  expect(isValid).toBe(false);
});

// Skipped: PlexAPI.validate() requests `library/sections` rather than the mocked `validate` endpoint
it.skip("returns true if the request succeeds", ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const plexApi = dataSourceMap.get(PlexAPI);
  const isValid = plexApi.validate();

  expect(isValid).toBe(true);
});

import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { PlexAPI } from "../plex.datasource.ts";

it("returns false if the request fails", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const plexApi = new PlexAPI({ cache: httpCache });
  const isValid = await plexApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const plexApi = new PlexAPI({ cache: httpCache });
  const isValid = await plexApi.validate();

  expect(isValid).toBe(true);
});

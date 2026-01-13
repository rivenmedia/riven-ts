import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { RealDebridAPI } from "../realdebrid.datasource.ts";

it("returns false if the request fails", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const realdebridApi = new RealDebridAPI({
    cache: httpCache,
    token: "test-token",
  });
  const isValid = await realdebridApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const realdebridApi = new RealDebridAPI({
    cache: httpCache,
    token: "test-token",
  });
  const isValid = await realdebridApi.validate();

  expect(isValid).toBe(true);
});

import { it } from "@repo/util-plugin-testing";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { MdblistAPI } from "../mdblist.datasource.ts";

it("returns false if the request fails", async ({ server, httpCache }) => {
  server.use(
    http.get("**/user", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const mdblistApi = new MdblistAPI({ cache: httpCache, token: "test-token" });
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server, httpCache }) => {
  server.use(http.get("**/user", () => HttpResponse.json({ success: true })));

  const mdblistApi = new MdblistAPI({ cache: httpCache, token: "test-token" });
  const isValid = await mdblistApi.validate();

  expect(isValid).toBe(true);
});

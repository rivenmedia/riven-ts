import { TestAPI } from "../test.datasource.ts";
import { expect } from "vitest";
import { it } from "@repo/core-util-vitest-test-context";
import { http, HttpResponse } from "msw";

it("returns false if the request fails", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const testApi = new TestAPI({ cache: httpCache, token: "test-token" });
  const isValid = await testApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({ server, httpCache }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const testApi = new TestAPI({ cache: httpCache, token: "test-token" });
  const isValid = await testApi.validate();

  expect(isValid).toBe(true);
});

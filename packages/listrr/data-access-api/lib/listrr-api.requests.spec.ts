import { ListrrAPI } from "./listrr-api.ts";
import { it } from "@repo/core-util-vitest-config/test-context";
import { http, HttpResponse } from "msw";
import { expect } from "vitest";

it('assigns the API to the "x-api-key" header', async ({ server }) => {
  const listrrApi = new ListrrAPI("test-token");

  server.use(
    http.get("https://listrr.pro/api/test-endpoint", ({ request }) => {
      if (request.headers.get("x-api-key") !== "test-token") {
        return HttpResponse.error();
      }

      return HttpResponse.json({ success: true });
    }),
  );

  const { parsedBody } = await listrrApi.fetch<{ success: boolean }>(
    "test-endpoint",
  );

  expect(parsedBody.success).toBe(true);
});

it.only("retries failed requests up to 3 times", async ({ server }) => {
  const listrrApi = new ListrrAPI("test-token");

  let attempt = 0;

  server.use(
    http.get("https://listrr.pro/api/retry-endpoint", () => {
      attempt++;

      console.log(`Attempt ${attempt.toFixed()}`);

      if (attempt < 3) {
        return HttpResponse.json(undefined, {
          status: 429,
        });
      }

      return HttpResponse.json({ success: true });
    }),
  );

  const { parsedBody } = await listrrApi.fetch<{ success: boolean } | null>(
    "retry-endpoint",
  );

  expect(parsedBody?.success).toBe(true);
  expect(attempt).toBe(3);
});

it("rate limits requests appropriately", async ({ server }) => {
  const listrrApi = new ListrrAPI("test-token");

  let requestCount = 0;

  server.use(
    http.get("https://listrr.pro/api/rate-limited-endpoint", () => {
      requestCount++;
      return HttpResponse.json({ success: true });
    }),
  );

  const requests = Array.from({ length: 10 }, () =>
    listrrApi.fetch<{ success: boolean }>("rate-limited-endpoint"),
  );

  await Promise.all(requests);

  expect(requestCount).toBe(5); // Adjust this based on your rate limiting logic
});

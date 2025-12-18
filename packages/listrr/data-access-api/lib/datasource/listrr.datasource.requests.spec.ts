import { ListrrAPI } from "./listrr.datasource.ts";
import { it } from "@repo/core-util-vitest-config/test-context";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";

const cache = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

it('assigns the API to the "x-api-key" header', async ({ server }) => {
  const listrrApi = new ListrrAPI({ cache, token: "test-token" });

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

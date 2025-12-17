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

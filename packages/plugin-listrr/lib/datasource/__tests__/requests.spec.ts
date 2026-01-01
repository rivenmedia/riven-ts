import { it } from "@repo/core-util-vitest-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { ListrrAPI } from "../listrr.datasource.ts";

it('assigns the API to the "x-api-key" header', async ({
  server,
  httpCache,
}) => {
  const listrrApi = new ListrrAPI({ cache: httpCache, token: "test-token" });

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

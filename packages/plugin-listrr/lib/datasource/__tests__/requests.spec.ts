import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { ListrrAPI } from "../listrr.datasource.ts";

it('assigns the API to the "x-api-key" header', async ({
  server,
  httpCache,
  redisUrl,
}) => {
  const listrrApi = new ListrrAPI({
    cache: httpCache,
    logger: {} as never,
    pluginSymbol: Symbol("@repo/plugin-listrr"),
    connection: {
      url: redisUrl,
    },
    settings: {
      apiKey: "test-token",
      movieLists: [],
      showLists: [],
    },
  });

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

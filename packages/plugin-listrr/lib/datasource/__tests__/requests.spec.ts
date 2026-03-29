import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/listrr.test-context.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

it('assigns the API key to the "x-api-key" header', async ({
  server,
  dataSourceMap,
}) => {
  const listrrApi = dataSourceMap.get(ListrrAPI);

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

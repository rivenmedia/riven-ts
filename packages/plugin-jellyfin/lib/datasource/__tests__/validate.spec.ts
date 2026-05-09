import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/jellyfin.test-context.ts";
import { pluginConfig } from "../../jellyfin-plugin.config.ts";
import { JellyfinAPI } from "../jellyfin.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const jellyfinApi = dataSourceMap.get(JellyfinAPI);
  const isValid = await jellyfinApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const jellyfinApi = dataSourceMap.get(JellyfinAPI);
  const isValid = await jellyfinApi.validate();

  expect(isValid).toBe(true);
});

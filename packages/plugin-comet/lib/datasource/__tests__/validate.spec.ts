import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { pluginConfig } from "../../comet-plugin.config.ts";
import { CometAPI } from "../comet.datasource.ts";

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const cometApi = new CometAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      url: "",
    },
  });
  const isValid = await cometApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const cometApi = new CometAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      url: "",
    },
  });
  const isValid = await cometApi.validate();

  expect(isValid).toBe(true);
});

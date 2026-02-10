import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { pluginConfig } from "../../torrentio-plugin.config.ts";
import { TorrentioAPI } from "../torrentio.datasource.ts";

it("returns false if the request fails", async ({
  server,
  httpCache,
  redisUrl,
  logger,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const torrentioApi = new TorrentioAPI({
    cache: httpCache,
    logger,
    pluginSymbol: pluginConfig.name,
    connection: {
      url: redisUrl,
    },
    settings: {
      filter: "",
    },
  });
  const isValid = await torrentioApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  httpCache,
  redisUrl,
  logger,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const torrentioApi = new TorrentioAPI({
    cache: httpCache,
    logger,
    pluginSymbol: pluginConfig.name,
    connection: {
      url: redisUrl,
    },
    settings: {
      filter: "",
    },
  });
  const isValid = await torrentioApi.validate();

  expect(isValid).toBe(true);
});

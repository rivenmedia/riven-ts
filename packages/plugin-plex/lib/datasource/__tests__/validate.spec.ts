import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { PlexAPI } from "../plex.datasource.ts";

it("returns false if the request fails", async ({
  server,
  httpCache,
  redisUrl,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const plexApi = new PlexAPI({
    cache: httpCache,
    settings: {
      plexLibraryPath: "",
      plexServerUrl: "",
      plexToken: "",
    },
    logger: {} as never,
    pluginSymbol: Symbol.for(""),
    connection: {
      url: redisUrl,
    },
  });

  const isValid = await plexApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  httpCache,
  redisUrl,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const plexApi = new PlexAPI({
    cache: httpCache,
    settings: {
      plexLibraryPath: "",
      plexServerUrl: "",
      plexToken: "",
    },
    logger: {} as never,
    pluginSymbol: Symbol.for(""),
    connection: {
      url: redisUrl,
    },
  });
  const isValid = await plexApi.validate();

  expect(isValid).toBe(true);
});

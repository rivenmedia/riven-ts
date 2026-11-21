import { Season } from "@repo/util-plugin-sdk/dto/entities";
import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it as baseIt } from "../__tests__/torrentio.test-context.ts";
import { TorrentioSettings } from "../torrentio-settings.schema.ts";
import { TorrentioAPI } from "./torrentio.datasource.ts";

const it = baseIt.extend(
  "streamsHandler",
  () => (requestedPaths: string[]) =>
    http.get("https://torrentio.strem.fun/*", ({ request }) => {
      requestedPaths.push(decodeURIComponent(new URL(request.url).pathname));

      return HttpResponse.json({ streams: [] });
    }),
);

it.override(
  "settings",
  createMockPluginSettings(TorrentioSettings, { filter: "sort=seeders" }),
);

it("requests the streams of a season through the configured filter", async ({
  streamsHandler,
  server,
  dataSourceMap,
}) => {
  const requestedPaths: string[] = [];
  const season = new Season();

  season.imdbId = "tt0944947";
  season.number = 2;

  server.use(streamsHandler(requestedPaths));

  await dataSourceMap.get(TorrentioAPI).scrape({ item: season });

  expect(requestedPaths).toStrictEqual([
    "/sort=seeders/stream/series/tt0944947:2:1.json",
  ]);
});

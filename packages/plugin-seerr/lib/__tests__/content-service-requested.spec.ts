import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getRequestHandler } from "../__generated__/handlers/getRequestHandler.ts";
import { SeerrSettings } from "../seerr-settings.schema.ts";
import { it } from "./seerr.test-context.ts";

import type { RequestResponse } from "../schemas/request-response.schema.ts";

it.override(
  "settings",
  createMockPluginSettings(SeerrSettings, {
    apiKey: "seerr-api-key",
    filter: "processing",
    updateIntervalSeconds: 300,
  }),
);

it("returns the requested content using the configured filter and update interval", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const contentServiceRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(contentServiceRequestedHook);

  const filters: (string | null)[] = [];

  server.use(
    getRequestHandler(({ request }) => {
      filters.push(new URL(request.url).searchParams.get("filter"));

      return HttpResponse.json<RequestResponse>({
        pageInfo: { results: 2 },
        results: [
          { id: 1, status: 2, type: "movie", media: { tmdbId: 550 } },
          {
            id: 2,
            status: 2,
            type: "tv",
            media: { id: 20, tvdbId: 121_361 },
            seasons: [{ id: 3, status: 2, seasonNumber: 1 }],
          },
        ],
      });
    }),
  );

  const response = await contentServiceRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(filters).toStrictEqual(["processing"]);
  expect(response).toStrictEqual({
    movies: [{ tmdbId: "550", externalRequestId: "1", requestedBy: undefined }],
    shows: [
      {
        tmdbId: undefined,
        tvdbId: "121361",
        externalRequestId: "20",
        requestedBy: undefined,
        seasons: [1],
      },
    ],
    updateIntervalSeconds: 300,
  });
});

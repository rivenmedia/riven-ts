import { HttpResponse } from "msw/http";
import { expect } from "vitest";

import { getAuthMeHandler } from "../__generated__/handlers/getAuthMeHandler.ts";
import { getSettingsMetadatasHandler } from "../__generated__/handlers/getSettingsMetadatasHandler.ts";
import { getSettingsNotificationsWebhookHandler } from "../__generated__/handlers/getSettingsNotificationsWebhookHandler.ts";
import { createGetAuthMeQueryResponse } from "../__generated__/mocks/createGetAuthMe.ts";
import { it } from "../__tests__/seerr.test-context.ts";
import {
  authenticated,
  metadataSettings,
} from "../__tests__/validate-fixtures.ts";
import { SeerrAPI } from "./seerr.datasource.ts";

it("returns false if the request fails", async ({ server, dataSourceMap }) => {
  server.use(
    getAuthMeHandler(() => HttpResponse.error()),
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  const seerrApi = dataSourceMap.get(SeerrAPI);
  const isValid = await seerrApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  const seerrApi = dataSourceMap.get(SeerrAPI);

  const isValid = await seerrApi.validate();

  expect(isValid).toBe(true);
});

it("sends the API key with each request", async ({ server, dataSourceMap }) => {
  server.use(
    getAuthMeHandler(({ request }) => {
      if (request.headers.get("x-api-key") !== "seerr-api-key") {
        return HttpResponse.json(null, { status: 401 });
      }

      return HttpResponse.json(createGetAuthMeQueryResponse());
    }),
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
});

it("returns false if the settings responses are malformed", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    getSettingsMetadatasHandler(() => HttpResponse.json({ tv: "imdb" })),
  );

  const isValid = await dataSourceMap.get(SeerrAPI).validate();

  expect(isValid).toBe(false);
});

import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse } from "msw/http";
import { expect } from "vitest";

import { getSettingsNotificationsWebhookHandler } from "../__generated__/handlers/getSettingsNotificationsWebhookHandler.ts";
import { putSettingsMetadatasHandler } from "../__generated__/handlers/putSettingsMetadatasHandler.ts";
import { it } from "../__tests__/seerr.test-context.ts";
import {
  authenticated,
  metadataSettings,
} from "../__tests__/validate-fixtures.ts";
import { SeerrSettings } from "../seerr-settings.schema.ts";
import { SeerrAPI } from "./seerr.datasource.ts";

import type { MetadataSettingsResponse } from "../schemas/metadata-settings-response.schema.ts";

it.override(
  "settings",
  createMockPluginSettings(SeerrSettings, {
    apiKey: "seerr-api-key",
    autofixMetadataProviders: true,
  }),
);

it("sets both providers to TVDB", async ({ server, dataSourceMap }) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tmdb", tv: "tmdb" }),
    // Seerr responds with the settings it applied, which the validator checks
    putSettingsMetadatasHandler(async ({ request }) =>
      HttpResponse.json(await request.json()),
    ),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  const isValid = await dataSourceMap.get(SeerrAPI).validate();

  expect(isValid).toBe(true);
});

it("does not update providers that are already valid", async ({
  server,
  dataSourceMap,
}) => {
  let updateCount = 0;

  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    putSettingsMetadatasHandler(() => {
      updateCount += 1;

      return HttpResponse.error();
    }),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
  expect(updateCount).toBe(0);
});

it("throws if Seerr does not apply the update", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tmdb", tv: "tmdb" }),
    putSettingsMetadatasHandler(() =>
      HttpResponse.json<MetadataSettingsResponse>({
        anime: "tvdb",
        tv: "tmdb",
      }),
    ),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).rejects.toThrow(
    /^Failed to automatically fix Seerr metadata provider settings\./u,
  );
});

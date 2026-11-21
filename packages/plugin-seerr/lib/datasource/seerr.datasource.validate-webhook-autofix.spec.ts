import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { postSettingsNotificationsWebhookHandler } from "../__generated__/handlers/postSettingsNotificationsWebhookHandler.ts";
import { webhookSettingsSchema } from "../__generated__/zod/webhookSettingsSchema.ts";
import { it } from "../__tests__/seerr.test-context.ts";
import {
  authenticated,
  metadataSettings,
  toSavedJsonPayload,
  validWebhookPayload,
  webhookSettings,
} from "../__tests__/validate-fixtures.ts";
import { SeerrSettings } from "../seerr-settings.schema.ts";
import { SeerrAPI } from "./seerr.datasource.ts";
import { WebhookNotificationType } from "./webhook-notification-types.ts";

import type { WebhookSettingsSchema } from "../__generated__/zod/webhookSettingsSchema.ts";

it.override(
  "settings",
  createMockPluginSettings(SeerrSettings, {
    apiKey: "seerr-api-key",
    autofixWebhookBody: true,
  }),
);

it("enables only the required types and sets the payload, keeping other settings", async ({
  server,
  dataSourceMap,
}) => {
  const updates: WebhookSettingsSchema[] = [];

  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    // oxlint-disable-next-line no-bitwise
    webhookSettings(WebhookNotificationType.REQUEST_APPROVED | 2, {
      query: "query { me }",
    }),
    postSettingsNotificationsWebhookHandler(async ({ request }) => {
      updates.push(webhookSettingsSchema.parse(await request.json()));

      return HttpResponse.json({
        enabled: true,
        types: WebhookNotificationType.REQUIRED,
        options: {
          webhookUrl: "https://riven.example/graphql",
          jsonPayload: toSavedJsonPayload(validWebhookPayload),
        },
      });
    }),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
  expect(updates).toHaveLength(1);

  const [update] = updates;

  expect.assert(update);

  expect(update).toStrictEqual({
    enabled: true,
    types: WebhookNotificationType.REQUIRED,
    options: {
      webhookUrl: "https://riven.example/graphql",
      jsonPayload: expect.any(String),
    },
  });
  expect.assert(typeof update.options?.jsonPayload === "string");
  expect(JSON.parse(update.options.jsonPayload)).toStrictEqual(
    validWebhookPayload,
  );
});

it("throws if Seerr does not apply the update", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    webhookSettings(0, validWebhookPayload),
    postSettingsNotificationsWebhookHandler(() =>
      HttpResponse.json({
        enabled: true,
        types: 0,
        options: {
          jsonPayload: toSavedJsonPayload(validWebhookPayload),
        },
      }),
    ),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).rejects.toThrow(
    /^Failed to automatically fix Seerr webhook settings\./u,
  );
});

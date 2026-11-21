import { FatalValidationError } from "@repo/util-plugin-sdk/errors/fatal-validation-error";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getSettingsNotificationsWebhookHandler } from "../__generated__/handlers/getSettingsNotificationsWebhookHandler.ts";
import { it } from "../__tests__/seerr.test-context.ts";
import {
  REQUEST_APPROVED,
  REQUEST_AUTO_APPROVED,
  REQUIRED_TYPES,
  authenticated,
  metadataSettings,
  validWebhookPayload,
  webhookSettings,
} from "../__tests__/validate-fixtures.ts";
import { SeerrAPI } from "./seerr.datasource.ts";

it("skips webhook validation when the webhook is disabled", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    getSettingsNotificationsWebhookHandler(() =>
      HttpResponse.json({ enabled: false, types: 0 }),
    ),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
});

it("accepts the required notification types with the expected payload", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    webhookSettings(REQUIRED_TYPES, validWebhookPayload),
  );

  await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
});

it.for([
  {
    types: REQUEST_AUTO_APPROVED,
    issue: '- "Request Approved" notification type is not enabled.',
  },
  {
    types: REQUEST_APPROVED,
    issue:
      '- "Request Automatically Approved" notification type is not enabled.',
  },
])(
  "lists missing notification types when types are $types",
  async ({ types, issue }, { server, dataSourceMap }) => {
    server.use(
      authenticated,
      metadataSettings({ anime: "tvdb", tv: "tvdb" }),
      webhookSettings(types, validWebhookPayload),
    );

    await expect(dataSourceMap.get(SeerrAPI).validate()).rejects.toThrow(
      `Invalid Seerr webhook settings:\n${issue}\nFix these in the webhook settings at http://localhost:5055/settings/webhooks or enable the "autofixWebhookBody" option in the plugin settings to have this automatically fixed by the plugin.`,
    );
  },
);

it("lists every issue when the types and payload are invalid", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    authenticated,
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    webhookSettings(0, { ...validWebhookPayload, query: "query { me }" }),
  );

  const error = await dataSourceMap
    .get(SeerrAPI)
    .validate()
    .catch((validationError: unknown) => validationError);

  expect.assert(error instanceof FatalValidationError);
  expect(error.message).toMatch(
    /^Invalid Seerr webhook settings:\n- "Request Approved" notification type is not enabled\n- "Request Automatically Approved" notification type is not enabled\n- .*\n {2}→ at query\./u,
  );
});

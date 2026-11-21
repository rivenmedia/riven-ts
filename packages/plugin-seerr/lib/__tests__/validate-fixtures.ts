import { HttpResponse } from "msw";

import { getAuthMeHandler } from "../__generated__/handlers/getAuthMeHandler.ts";
import { getSettingsMetadatasHandler } from "../__generated__/handlers/getSettingsMetadatasHandler.ts";
import { getSettingsNotificationsWebhookHandler } from "../__generated__/handlers/getSettingsNotificationsWebhookHandler.ts";
import { createGetAuthMeQueryResponse } from "../__generated__/mocks/createGetAuthMe.ts";

import type { MetadataSettingsResponse } from "../schemas/metadata-settings-response.schema.ts";
import type { WebhookJsonPayload } from "../schemas/webhook-json-payload.schema.ts";

export const validWebhookPayload = {
  query:
    "mutation ($input: SeerrHandleWebhookInput!) { seerrHandleWebhook(input: $input) }",
  variables: {
    input: {
      payload: {
        notification_type: "{{notification_type}}",
        "{{media}}": {
          media_type: "{{media_type}}",
          imdbId: "{{media_imdbid}}",
          tmdbId: "{{media_tmdbid}}",
          tvdbId: "{{media_tvdbid}}",
        },
        "{{request}}": {
          request_id: "{{request_id}}",
          requestedBy_email: "{{requestedBy_email}}",
        },
        "{{extra}}": [],
      },
    },
  },
} satisfies WebhookJsonPayload;

export const metadataSettings = (settings: MetadataSettingsResponse) =>
  getSettingsMetadatasHandler(() =>
    HttpResponse.json<MetadataSettingsResponse>(settings),
  );

export const webhookSettings = (types: number, jsonPayload: unknown) =>
  getSettingsNotificationsWebhookHandler(() =>
    HttpResponse.json({
      enabled: true,
      types,
      options: {
        webhookUrl: "https://riven.example/graphql",
        jsonPayload: JSON.stringify(jsonPayload),
      },
    }),
  );

export const authenticated = getAuthMeHandler(() =>
  HttpResponse.json(createGetAuthMeQueryResponse()),
);

/**
 * Encodes a webhook payload the way Seerr returns it after saving: a base64 encoded JSON string.
 */
export const toSavedJsonPayload = (payload: unknown) =>
  Buffer.from(JSON.stringify(JSON.stringify(payload))).toString("base64");

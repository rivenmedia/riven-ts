import { FatalValidationError } from "@repo/util-plugin-sdk/errors/fatal-validation-error";
import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse } from "msw";
import { describe, expect } from "vitest";

import { getAuthMeHandler } from "../../__generated__/handlers/getAuthMeHandler.ts";
import { getSettingsMetadatasHandler } from "../../__generated__/handlers/getSettingsMetadatasHandler.ts";
import { getSettingsNotificationsWebhookHandler } from "../../__generated__/handlers/getSettingsNotificationsWebhookHandler.ts";
import { postSettingsNotificationsWebhookHandler } from "../../__generated__/handlers/postSettingsNotificationsWebhookHandler.ts";
import { putSettingsMetadatasHandler } from "../../__generated__/handlers/putSettingsMetadatasHandler.ts";
import { createGetAuthMeQueryResponse } from "../../__generated__/mocks/createGetAuthMe.ts";
import { it } from "../../__tests__/seerr.test-context.ts";
import { SeerrSettings } from "../../seerr-settings.schema.ts";
import { SeerrAPI } from "../seerr.datasource.ts";

import type { MetadataSettingsResponse } from "../../schemas/metadata-settings-response.schema.ts";
import type { WebhookJsonPayload } from "../../schemas/webhook-json-payload.schema.ts";

const REQUEST_APPROVED = 4;
const REQUEST_AUTO_APPROVED = 128;
const REQUIRED_TYPES = REQUEST_APPROVED + REQUEST_AUTO_APPROVED;

const validWebhookPayload = {
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

const metadataSettings = (settings: MetadataSettingsResponse) =>
  getSettingsMetadatasHandler(() =>
    HttpResponse.json<MetadataSettingsResponse>(settings),
  );

const webhookSettings = (types: number, jsonPayload: unknown) =>
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

const authenticated = getAuthMeHandler(() =>
  HttpResponse.json(createGetAuthMeQueryResponse()),
);

/**
 * Encodes a webhook payload the way Seerr returns it after saving: a base64 encoded JSON string.
 */
const toSavedJsonPayload = (payload: unknown) =>
  Buffer.from(JSON.stringify(JSON.stringify(payload))).toString("base64");

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
  const apiKeys: (string | null)[] = [];

  server.use(
    getAuthMeHandler(({ request }) => {
      apiKeys.push(request.headers.get("x-api-key"));

      return HttpResponse.json(createGetAuthMeQueryResponse());
    }),
    metadataSettings({ anime: "tvdb", tv: "tvdb" }),
    getSettingsNotificationsWebhookHandler({ enabled: false }),
  );

  await dataSourceMap.get(SeerrAPI).validate();

  expect(apiKeys).toStrictEqual(["seerr-api-key"]);
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

describe("metadata providers", () => {
  it.for([
    { tv: "tmdb", anime: "tvdb" },
    { tv: "tvdb", anime: "tmdb" },
  ] as const)(
    "throws if the TV provider is $tv and the anime provider is $anime",
    async (settings, { server, dataSourceMap }) => {
      server.use(authenticated, metadataSettings(settings));

      await expect(dataSourceMap.get(SeerrAPI).validate()).rejects.toThrow(
        new FatalValidationError(
          `Invalid Seerr metadata provider settings. TV provider: ${settings.tv}, Anime provider: ${settings.anime}. Ensure both are set to TVDB at http://localhost:5055/settings/metadata or enable "autofixMetadataProviders" option in the plugin settings to have this automatically fixed by the plugin.`,
        ),
      );
    },
  );

  describe("with autofix enabled", () => {
    it.override(
      "settings",
      createMockPluginSettings(SeerrSettings, {
        apiKey: "seerr-api-key",
        autofixMetadataProviders: true,
      }),
    );

    it("sets both providers to TVDB", async ({ server, dataSourceMap }) => {
      const updates: unknown[] = [];

      server.use(
        authenticated,
        metadataSettings({ anime: "tmdb", tv: "tmdb" }),
        putSettingsMetadatasHandler(async ({ request }) => {
          updates.push(await request.json());

          return HttpResponse.json<MetadataSettingsResponse>({
            anime: "tvdb",
            tv: "tvdb",
          });
        }),
        getSettingsNotificationsWebhookHandler({ enabled: false }),
      );

      const isValid = await dataSourceMap.get(SeerrAPI).validate();

      expect(isValid).toBe(true);
      expect(updates).toStrictEqual([{ tv: "tvdb", anime: "tvdb" }]);
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
  });
});

describe("webhook", () => {
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

    expect(error).toBeInstanceOf(FatalValidationError);
    expect((error as Error).message).toMatch(
      /^Invalid Seerr webhook settings:\n- "Request Approved" notification type is not enabled\n- "Request Automatically Approved" notification type is not enabled\n- .*\n {2}→ at query\./u,
    );
  });

  describe("with autofix enabled", () => {
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
      const updates: unknown[] = [];

      server.use(
        authenticated,
        metadataSettings({ anime: "tvdb", tv: "tvdb" }),
        webhookSettings(REQUEST_APPROVED + 2, { query: "query { me }" }),
        postSettingsNotificationsWebhookHandler(async ({ request }) => {
          updates.push(await request.json());

          return HttpResponse.json({
            enabled: true,
            types: REQUIRED_TYPES,
            options: {
              webhookUrl: "https://riven.example/graphql",
              jsonPayload: toSavedJsonPayload(validWebhookPayload),
            },
          });
        }),
      );

      await expect(dataSourceMap.get(SeerrAPI).validate()).resolves.toBe(true);
      expect(updates).toHaveLength(1);

      const [update] = updates as [
        {
          enabled: boolean;
          types: number;
          options: { webhookUrl: string; jsonPayload: string };
        },
      ];

      expect(update).toStrictEqual({
        enabled: true,
        types: REQUIRED_TYPES,
        options: {
          webhookUrl: "https://riven.example/graphql",
          jsonPayload: expect.any(String),
        },
      });
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
  });
});

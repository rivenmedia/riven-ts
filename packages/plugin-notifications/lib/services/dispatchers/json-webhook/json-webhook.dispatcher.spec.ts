import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { notificationPayloadFixture } from "../../__tests__/payload.fixture.ts";
import { sendNotification } from "../index.ts";

it('sends the expected payload to the configured HTTPS URL for the "jsons" scheme', async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post("https://example.com/webhook", async ({ request }) => {
      const params = await request.json();
      const isExpectedPayload =
        JSON.stringify(params) === JSON.stringify(notificationPayloadFixture);

      if (!isExpectedPayload) {
        return HttpResponse.error();
      }

      return HttpResponse.json({
        success: true,
      });
    }),
  );

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: ["jsons://example.com/webhook"],
    },
  });

  await expect(
    sendNotification(
      "jsons://example.com/webhook",
      notificationPayloadFixture,
      api,
    ),
  ).resolves.not.toThrow();
});

it('sends the expected payload to the configured HTTP URL for the "json" scheme', async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post("http://example.com/webhook", async ({ request }) => {
      const params = await request.json();
      const isExpectedPayload =
        JSON.stringify(params) === JSON.stringify(notificationPayloadFixture);

      if (!isExpectedPayload) {
        return HttpResponse.error();
      }

      return HttpResponse.json({
        success: true,
      });
    }),
  );

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: ["json://example.com/webhook"],
    },
  });

  await expect(
    sendNotification(
      "json://example.com/webhook",
      notificationPayloadFixture,
      api,
    ),
  ).resolves.not.toThrow();
});

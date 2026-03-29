import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw";
import { describe, expect } from "vitest";

import { it } from "../../../__tests__/notifications.test-context.ts";
import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { NotificationsSettings } from "../../../notifications-settings.schema.ts";
import { notificationPayloadFixture } from "../../__tests__/payload.fixture.ts";
import { sendNotification } from "../send-notification.ts";

describe("json://", () => {
  const url = "json://example.com/webhook";

  it.override(
    "settings",
    createMockPluginSettings(NotificationsSettings, {
      urls: JSON.stringify([url]),
    }),
  );

  it("sends the expected payload to the configured HTTP URL", async ({
    server,
    dataSourceMap,
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

    const api = dataSourceMap.get(NotificationsAPI);

    await expect(
      sendNotification(url, notificationPayloadFixture, api),
    ).resolves.not.toThrow();
  });
});

describe("jsons://", () => {
  const url = "jsons://example.com/webhook";

  it.override(
    "settings",
    createMockPluginSettings(NotificationsSettings, {
      urls: JSON.stringify([url]),
    }),
  );

  it("sends the expected payload to the configured HTTPS URL", async ({
    server,
    dataSourceMap,
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

    const api = dataSourceMap.get(NotificationsAPI);

    await expect(
      sendNotification(url, notificationPayloadFixture, api),
    ).resolves.not.toThrow();
  });
});

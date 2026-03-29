import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../../__tests__/notifications.test-context.ts";
import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { notificationPayloadFixture } from "../../__tests__/payload.fixture.ts";
import { sendNotification } from "../send-notification.ts";

it("sends the expected payload to the configured HTTP URL when using json:// scheme", async ({
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
    sendNotification(
      "json://example.com/webhook",
      notificationPayloadFixture,
      api,
    ),
  ).resolves.not.toThrow();
});

it("sends the expected payload to the configured HTTPS URL when using jsons:// scheme", async ({
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
    sendNotification(
      "jsons://example.com/webhook",
      notificationPayloadFixture,
      api,
    ),
  ).resolves.not.toThrow();
});

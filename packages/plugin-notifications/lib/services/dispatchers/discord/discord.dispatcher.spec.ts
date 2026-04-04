import { type } from "arktype";
import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../../__tests__/notifications.test-context.ts";
import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { notificationPayloadFixture } from "../../__tests__/payload.fixture.ts";
import { discordDispatcher } from "./discord.dispatcher.ts";
import { buildEmbed } from "./utilities/build-embed.ts";

import type { DiscordService } from "../../parse-notification-url.ts";

const mockService = {
  webhookId: "webhook-id",
  webhookToken: "webhook-token",
} as const satisfies Omit<DiscordService, "type">;

it("sends an embed to the correct Discord webhook URL when using discord:// scheme", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post(
      `https://discord.com/api/webhooks/${mockService.webhookId}/${mockService.webhookToken}`,
      async ({ request }) => {
        const params = type({ embeds: "unknown[]" }).assert(
          await request.json(),
        );

        const isExpectedPayload =
          JSON.stringify(params.embeds[0]) ===
          JSON.stringify(buildEmbed(notificationPayloadFixture));

        if (!isExpectedPayload) {
          return HttpResponse.error();
        }

        return HttpResponse.json({});
      },
    ),
  );

  const api = dataSourceMap.get(NotificationsAPI);

  await expect(
    discordDispatcher.send(mockService, notificationPayloadFixture, api),
  ).resolves.not.toThrow();
});

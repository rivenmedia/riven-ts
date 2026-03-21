import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";
import z from "zod";

import { NotificationsAPI } from "../../../datasource/notifications.datasource.ts";
import { pluginConfig } from "../../../notifications-plugin.config.ts";
import { notificationPayloadFixture } from "../../__tests__/payload.fixture.ts";
import { discordDispatcher } from "./discord.dispatcher.ts";
import { buildEmbed } from "./utilities/build-embed.ts";

import type { DiscordService } from "../../parse-notification-url.ts";

const mockService = {
  webhookId: "webhook-id",
  webhookToken: "webhook-token",
} as const satisfies Omit<DiscordService, "type">;

it("sends an embed to the correct Discord webhook URL", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.post(
      `https://discord.com/api/webhooks/${mockService.webhookId}/${mockService.webhookToken}`,
      async ({ request }) => {
        const params = z
          .object({
            embeds: z.array(z.unknown()),
          })
          .parse(await request.json());

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

  const api = new NotificationsAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      urls: [`discord://${mockService.webhookId}/${mockService.webhookToken}`],
    },
  });

  await expect(
    discordDispatcher.send(mockService, notificationPayloadFixture, api),
  ).resolves.not.toThrow();
});

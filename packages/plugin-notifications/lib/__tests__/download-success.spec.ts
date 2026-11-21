import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { NotificationsSettings } from "../notifications-settings.schema.ts";
import { it } from "./notifications.test-context.ts";

it.override(
  "settings",
  createMockPluginSettings(NotificationsSettings, {
    urls: [
      "json://failing.example.com/hook",
      "jsons://hooks.example.com/riven",
    ],
  }),
);

it("sends the notification to every URL, even when one fails", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const downloadSuccessHook = plugin.hooks["riven.media-item.download.success"];

  expect.assert(downloadSuccessHook);

  const received: unknown[] = [];

  server.use(
    http.post("http://failing.example.com/hook", () =>
      HttpResponse.json(null, { status: 404 }),
    ),
    http.post("https://hooks.example.com/riven", async ({ request }) => {
      received.push(await request.json());

      return HttpResponse.json({});
    }),
  );

  const item = Object.assign(new Movie(), {
    title: "Inception",
    fullTitle: "Inception (2010)",
    tmdbId: "27205",
  });

  await expect(
    downloadSuccessHook({
      dataSources: dataSourceMap,
      settings,
      logger,
      event: {
        item,
        downloader: "@repo/plugin-stremthru",
        provider: "realdebrid",
        durationMs: 1000,
      },
    }),
  ).resolves.toBeUndefined();

  expect(received).toStrictEqual([
    expect.objectContaining({
      event: "riven.media-item.download.success",
      fullTitle: "Inception (2010)",
      tmdbId: "27205",
      downloader: "@repo/plugin-stremthru",
      provider: "realdebrid",
      durationSeconds: 1,
    }),
  ]);
});

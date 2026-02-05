import { DataSourceMap } from "@repo/util-plugin-sdk";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/index";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import { mockLogger } from "@repo/util-plugin-testing/create-mock-logger";
import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as baseIt } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import breakingBadExtendedSeriesFixture from "../__fixtures__/breaking-bad-extended-series.json" with { type: "json" };
import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";
import { indexRequestedHook } from "./index-requested.hook.ts";

import type { PostLogin200 } from "../__generated__/index.ts";

const it = baseIt.extend<{
  settings: PluginSettings;
  dataSourceMap: DataSourceMap;
  item: RequestedItem;
  setupMocks: undefined;
}>({
  async settings({}, use) {
    const settings = createMockPluginSettings(TvdbSettings, {});

    await use(settings);
  },
  async dataSourceMap({ httpCache, settings, redisUrl }, use) {
    const dataSourceMap = new DataSourceMap([
      [
        TvdbAPI,
        new TvdbAPI({
          requestAttempts: 1,
          cache: httpCache,
          logger: mockLogger,
          settings: settings.get(TvdbSettings),
          pluginSymbol: pluginConfig.name,
          connection: {
            url: redisUrl,
          },
        }),
      ],
    ]);

    await use(dataSourceMap);
  },
  async item({}, use) {
    const item = new RequestedItem();

    await use(item);
  },
  setupMocks: [
    async ({ server }, use) => {
      server.use(
        http.post("https://api4.thetvdb.com/v4/login", () =>
          HttpResponse.json<PostLogin200>({
            data: {
              token: "mock-token",
            },
          }),
        ),
      );

      await use(undefined);
    },
    { auto: true },
  ],
});

it("returns null if the item has no tvdbId", async ({
  item,
  dataSourceMap,
  settings,
}) => {
  const result = await indexRequestedHook({
    dataSources: dataSourceMap,
    event: {
      item,
    },

    logger: mockLogger,

    settings,
  });

  expect(result).toBeNull();
});

it("returns the series if the item has a tvdbId", async ({
  item,
  dataSourceMap,
  settings,
  server,
}) => {
  item.tvdbId = breakingBadExtendedSeriesFixture.data.id.toString();

  server.use(
    http.get(`https://api4.thetvdb.com/v4/series/:id/extended`, () =>
      HttpResponse.json(breakingBadExtendedSeriesFixture),
    ),
  );

  const result = await indexRequestedHook({
    dataSources: dataSourceMap,
    event: {
      item,
    },
    logger: mockLogger,
    settings,
  });

  expect.assert(result);

  console.log(result);

  // expect(result).not.toBeNull();
});

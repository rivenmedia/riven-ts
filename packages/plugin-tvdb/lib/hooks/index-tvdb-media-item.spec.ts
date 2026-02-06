import { DataSourceMap } from "@repo/util-plugin-sdk";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import { mockLogger } from "@repo/util-plugin-testing/create-mock-logger";
import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as baseIt } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import breakingBadExtendedSeason1Fixture from "../__fixtures__/breaking-bad/extended-season-1.json" with { type: "json" };
import breakingBadExtendedSeason2Fixture from "../__fixtures__/breaking-bad/extended-season-2.json" with { type: "json" };
import breakingBadExtendedSeason3Fixture from "../__fixtures__/breaking-bad/extended-season-3.json" with { type: "json" };
import breakingBadExtendedSeason4Fixture from "../__fixtures__/breaking-bad/extended-season-4.json" with { type: "json" };
import breakingBadExtendedSeason5Fixture from "../__fixtures__/breaking-bad/extended-season-5.json" with { type: "json" };
import breakingBadExtendedSeriesFixture from "../__fixtures__/breaking-bad/extended-series.json" with { type: "json" };
import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { pluginConfig } from "../tvdb-plugin.config.ts";
import { TvdbSettings } from "../tvdb-settings.schema.ts";
import { indexTVDBMediaItem } from "./index-tvdb-media-item.ts";

import type { PostLogin200 } from "../__generated__/index.ts";

const it = baseIt.extend<{
  settings: PluginSettings;
  dataSourceMap: DataSourceMap;
  item: RequestedItem;
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

    item.id = 1;

    await use(item);
  },
});

it.beforeEach(({ server }) => {
  server.use(
    http.post("https://api4.thetvdb.com/v4/login", () =>
      HttpResponse.json<PostLogin200>({
        data: {
          token: "mock-token",
        },
      }),
    ),
  );
});

it("returns null if the item has no tvdbId", async ({
  item,
  dataSourceMap,
  settings,
}) => {
  const result = await indexTVDBMediaItem({
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
    http.get(
      `https://api4.thetvdb.com/v4/series/${breakingBadExtendedSeriesFixture.data.id.toString()}/extended`,
      () => HttpResponse.json(breakingBadExtendedSeriesFixture),
    ),
    http.get<{ id: string }>(
      `https://api4.thetvdb.com/v4/seasons/:id/extended`,
      ({ params: { id } }) => {
        switch (id) {
          case breakingBadExtendedSeason1Fixture.data.id.toString():
            return HttpResponse.json(breakingBadExtendedSeason1Fixture);
          case breakingBadExtendedSeason2Fixture.data.id.toString():
            return HttpResponse.json(breakingBadExtendedSeason2Fixture);
          case breakingBadExtendedSeason3Fixture.data.id.toString():
            return HttpResponse.json(breakingBadExtendedSeason3Fixture);
          case breakingBadExtendedSeason4Fixture.data.id.toString():
            return HttpResponse.json(breakingBadExtendedSeason4Fixture);
          case breakingBadExtendedSeason5Fixture.data.id.toString():
            return HttpResponse.json(breakingBadExtendedSeason5Fixture);
          default:
            return HttpResponse.json(undefined, { status: 404 });
        }
      },
    ),
  );

  const result = await indexTVDBMediaItem({
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

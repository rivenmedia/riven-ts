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
          case "30272":
            return HttpResponse.json(breakingBadExtendedSeason1Fixture);
          case "40719":
            return HttpResponse.json(breakingBadExtendedSeason2Fixture);
          case "171641":
            return HttpResponse.json(breakingBadExtendedSeason3Fixture);
          case "297361":
            return HttpResponse.json(breakingBadExtendedSeason4Fixture);
          case "490110":
            return HttpResponse.json(breakingBadExtendedSeason5Fixture);
          default:
            return HttpResponse.error();
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

  expect(result.item).toStrictEqual({
    id: 1,
    imdbId: "tt0903747",
    type: "show",
    title: "Breaking Bad",
    genres: ["Drama", "Crime", "Thriller", "Western"],
    network: "AMC",
    country: "usa",
    aliases: { us: ["breaking-bad"] },
    contentRating: "TV-MA",
    posterUrl: "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
    firstAired: "2008-01-20",
    status: "ended",
    seasons: [
      {
        episodes: [
          {
            airedAt: "2008-01-20",
            contentRating: "TV-MA",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6421d9584f9dd.jpg",
            runtime: 58,
            title: "Pilot",
          },
          {
            airedAt: "2008-01-27",
            contentRating: "TV-MA",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642203f37c277.jpg",
            runtime: 48,
            title: "Cat's in the Bag...",
          },
          {
            airedAt: "2008-02-10",
            contentRating: "TV-MA",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea716c6a773d.jpg",
            runtime: 48,
            title: "...And the Bag's in the River",
          },
          {
            airedAt: "2008-02-17",
            contentRating: "TV-MA",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/64232be19ffa2.jpg",
            runtime: 48,
            title: "Cancer Man",
          },
          {
            airedAt: "2008-02-24",
            contentRating: "TV-MA",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea71ca4d8cf8.jpg",
            runtime: 48,
            title: "Gray Matter",
          },
          {
            airedAt: "2008-03-09",
            contentRating: "TV-MA",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea8700bb5d18.jpg",
            runtime: 48,
            title: "A No-Rough-Stuff-Type Deal",
          },
          {
            airedAt: "2008-03-02",
            contentRating: "TV-MA",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea72a5bd991e.jpg",
            runtime: 48,
            title: "Crazy Handful of Nothin'",
          },
        ],
        number: 1,
      },
      {
        episodes: [
          {
            airedAt: "2009-03-08",
            contentRating: "TV-MA",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea87588d39fc.jpg",
            runtime: 47,
            title: "Seven Thirty-Seven",
          },
          {
            airedAt: "2009-03-15",
            contentRating: "TV-MA",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea89ad421a42.jpg",
            runtime: 46,
            title: "Grilled",
          },
          {
            airedAt: "2009-03-22",
            contentRating: "TV-MA",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea89d1b129f3.jpg",
            runtime: 47,
            title: "Bit by a Dead Bee",
          },
          {
            airedAt: "2009-03-29",
            contentRating: "TV-MA",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdbf1815106.jpg",
            runtime: 47,
            title: "Down",
          },
          {
            airedAt: "2009-04-05",
            contentRating: "TV-MA",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdc501c14f5.jpg",
            runtime: 47,
            title: "Breakage",
          },
          {
            airedAt: "2009-04-12",
            contentRating: "TV-MA",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdc8791a975.jpg",
            runtime: 47,
            title: "Peekaboo",
          },
          {
            airedAt: "2009-04-19",
            contentRating: "TV-MA",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdcdc7e746f.jpg",
            runtime: 47,
            title: "Negro y Azul",
          },
          {
            airedAt: "2009-04-26",
            contentRating: "TV-MA",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdd48aca19a.jpg",
            runtime: 47,
            title: "Better Call Saul",
          },
          {
            airedAt: "2009-05-03",
            contentRating: "TV-MA",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebede40ebf91.jpg",
            runtime: 47,
            title: "4 Days Out",
          },
          {
            airedAt: "2009-05-10",
            contentRating: "TV-MA",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebedf6e80794.jpg",
            runtime: 47,
            title: "Over",
          },
          {
            airedAt: "2009-05-17",
            contentRating: "TV-MA",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebee9d56e81e.jpg",
            runtime: 47,
            title: "Mandala",
          },
          {
            airedAt: "2009-05-24",
            contentRating: "TV-MA",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebeed67dcacb.jpg",
            runtime: 47,
            title: "Phoenix",
          },
          {
            airedAt: "2009-05-31",
            contentRating: "TV-MA",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebeeecf13014.jpg",
            runtime: 48,
            title: "ABQ",
          },
        ],
        number: 2,
      },
      {
        episodes: [
          {
            airedAt: "2010-03-21",
            contentRating: "TV-MA",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642c8e983cc69.jpg",
            runtime: 47,
            title: "No Más",
          },
          {
            airedAt: "2010-03-28",
            contentRating: "TV-MA",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642cae4b49286.jpg",
            runtime: 47,
            title: "Caballo sin Nombre",
          },
          {
            airedAt: "2010-04-04",
            contentRating: "TV-MA",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642d74fc96d80.jpg",
            runtime: 47,
            title: "I.F.T.",
          },
          {
            airedAt: "2010-04-11",
            contentRating: "TV-MA",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642da9038a4b1.jpg",
            runtime: 47,
            title: "Green Light",
          },
          {
            airedAt: "2010-04-18",
            contentRating: "TV-MA",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642dc2db9f454.jpg",
            runtime: 47,
            title: "Más",
          },
          {
            airedAt: "2010-04-25",
            contentRating: "TV-MA",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf1d3fb3ff4.jpg",
            runtime: 47,
            title: "Sunset",
          },
          {
            airedAt: "2010-05-02",
            contentRating: "TV-MA",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf237fb10b1.jpg",
            runtime: 47,
            title: "One Minute",
          },
          {
            airedAt: "2010-05-09",
            contentRating: "TV-MA",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf24da09ad0.jpg",
            runtime: 47,
            title: "I See You",
          },
          {
            airedAt: "2010-05-16",
            contentRating: "TV-MA",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642f365806330.jpg",
            runtime: 47,
            title: "Kafkaesque",
          },
          {
            airedAt: "2010-05-23",
            contentRating: "TV-MA",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642f367d1808f.jpg",
            runtime: 47,
            title: "Fly",
          },
          {
            airedAt: "2010-05-30",
            contentRating: "TV-MA",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec2ea711fdc5.jpg",
            runtime: 47,
            title: "Abiquiu",
          },
          {
            airedAt: "2010-06-06",
            contentRating: "TV-MA",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec2f2a8a7a3b.jpg",
            runtime: 47,
            title: "Half Measures",
          },
          {
            airedAt: "2010-06-13",
            contentRating: "TV-MA",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6430a1fd84f79.jpg",
            runtime: 47,
            title: "Full Measure",
          },
        ],
        number: 3,
      },
      {
        episodes: [
          {
            airedAt: "2011-07-17",
            contentRating: "TV-MA",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6431eb24c04af.jpg",
            runtime: 48,
            title: "Box Cutter",
          },
          {
            airedAt: "2011-07-24",
            contentRating: "TV-MA",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6432fb7d85d01.jpg",
            runtime: 46,
            title: "Thirty-Eight Snub",
          },
          {
            airedAt: "2011-07-31",
            contentRating: "TV-MA",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/64330d3336d8a.jpg",
            runtime: 47,
            title: "Open House",
          },
          {
            airedAt: "2011-08-07",
            contentRating: "TV-MA",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec3219910251.jpg",
            runtime: 47,
            title: "Bullet Points",
          },
          {
            airedAt: "2011-08-14",
            contentRating: "TV-MA",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643595909286e.jpg",
            runtime: 47,
            title: "Shotgun",
          },
          {
            airedAt: "2011-08-21",
            contentRating: "TV-MA",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6435a700ddb2c.jpg",
            runtime: 47,
            title: "Cornered",
          },
          {
            airedAt: "2011-08-28",
            contentRating: "TV-MA",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6435bcc005073.jpg",
            runtime: 47,
            title: "Problem Dog",
          },
          {
            airedAt: "2011-09-04",
            contentRating: "TV-MA",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6437cc3d70968.jpg",
            runtime: 47,
            title: "Hermanos",
          },
          {
            airedAt: "2011-09-11",
            contentRating: "TV-MA",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4384965fb5.jpg",
            runtime: 47,
            title: "Bug",
          },
          {
            airedAt: "2011-09-18",
            contentRating: "TV-MA",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec43964e72b8.jpg",
            runtime: 47,
            title: "Salud",
          },
          {
            airedAt: "2011-09-25",
            contentRating: "TV-MA",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6439730668d56.jpg",
            runtime: 47,
            title: "Crawl Space",
          },
          {
            airedAt: "2011-10-02",
            contentRating: "TV-MA",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec43f0bd0393.jpg",
            runtime: 47,
            title: "End Times",
          },
          {
            airedAt: "2011-10-09",
            contentRating: "TV-MA",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6439a250a06ca.jpg",
            runtime: 50,
            title: "Face Off",
          },
        ],
        number: 4,
      },
      {
        episodes: [
          {
            airedAt: "2012-07-15",
            contentRating: "TV-MA",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec44a5282bb8.jpg",
            runtime: 43,
            title: "Live Free or Die",
          },
          {
            airedAt: "2012-07-22",
            contentRating: "TV-MA",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643a5dff8b925.jpg",
            runtime: 48,
            title: "Madrigal",
          },
          {
            airedAt: "2012-07-29",
            contentRating: "TV-MA",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643b0b02f2427.jpg",
            runtime: 48,
            title: "Hazard Pay",
          },
          {
            airedAt: "2012-08-05",
            contentRating: "TV-MA",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643c054d8f33a.jpg",
            runtime: 48,
            title: "Fifty-One",
          },
          {
            airedAt: "2012-08-12",
            contentRating: "TV-MA",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643c450d914f6.jpg",
            runtime: 48,
            title: "Dead Freight",
          },
          {
            airedAt: "2012-08-19",
            contentRating: "TV-MA",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec45d0ab85aa.jpg",
            runtime: 48,
            title: "Buyout",
          },
          {
            airedAt: "2012-08-26",
            contentRating: "TV-MA",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643d713000300.jpg",
            runtime: 48,
            title: "Say My Name",
          },
          {
            airedAt: "2012-09-02",
            contentRating: "TV-MA",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4628385493.jpg",
            runtime: 48,
            title: "Gliding Over All",
          },
          {
            airedAt: "2013-08-11",
            contentRating: "TV-MA",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643d9bb73189e.jpg",
            runtime: 48,
            title: "Blood Money",
          },
          {
            airedAt: "2013-08-18",
            contentRating: "TV-MA",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4787fbd5b3.jpg",
            runtime: 48,
            title: "Buried",
          },
          {
            airedAt: "2013-08-25",
            contentRating: "TV-MA",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643dc3212e518.jpg",
            runtime: 48,
            title: "Confessions",
          },
          {
            airedAt: "2013-09-01",
            contentRating: "TV-MA",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643eed7cc5a34.jpg",
            runtime: 48,
            title: "Rabid Dog",
          },
          {
            airedAt: "2013-09-08",
            contentRating: "TV-MA",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f05b447467.jpg",
            runtime: 47,
            title: "To'hajiilee",
          },
          {
            airedAt: "2013-09-15",
            contentRating: "TV-MA",
            number: 14,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f13cf31542.jpg",
            runtime: 48,
            title: "Ozymandias",
          },
          {
            airedAt: "2013-09-22",
            contentRating: "TV-MA",
            number: 15,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f2821d00fc.jpg",
            runtime: 55,
            title: "Granite State",
          },
          {
            airedAt: "2013-09-29",
            contentRating: "TV-MA",
            number: 16,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f38bb24163.jpg",
            runtime: 55,
            title: "Felina",
          },
        ],
        number: 5,
      },
    ],
  });
});

import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import breakingBadExtendedSeriesFixture from "../__fixtures__/breaking-bad/extended-series.json" with { type: "json" };
import breakingBadOfficialOrderFixture from "../__fixtures__/breaking-bad/official-order.json" with { type: "json" };
import breakingBadTvMazeLookupFixture from "../__fixtures__/breaking-bad/tvmaze-lookup.json" with { type: "json" };
import { postLoginHandler } from "../__generated__/index.ts";
import { it as baseIt } from "../__tests__/tvdb.test-context.ts";
import { indexTVDBMediaItem } from "./index-tvdb-media-item.ts";

const it = baseIt.extend("item", ({}) => {
  const item = new ItemRequest();

  item.id = randomUUID();

  return item;
});

it.beforeEach(({ server }) => {
  server.use(postLoginHandler());
});

it("returns null if the item has no tvdbId", async ({
  item,
  dataSourceMap,
  settings,
  logger,
}) => {
  const result = await indexTVDBMediaItem({
    dataSources: dataSourceMap,
    event: {
      item,
    },
    logger,
    settings,
  });

  expect(result).toBeNull();
});

it("returns the series if the item has a tvdbId", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  item.tvdbId = breakingBadOfficialOrderFixture.data.id.toString();

  server.use(
    http.get(
      `https://api4.thetvdb.com/v4/series/${breakingBadOfficialOrderFixture.data.id.toString()}/episodes/official/eng`,
      () => HttpResponse.json(breakingBadOfficialOrderFixture),
    ),
    http.get(
      `https://api4.thetvdb.com/v4/series/${breakingBadOfficialOrderFixture.data.id.toString()}/extended`,
      () => HttpResponse.json(breakingBadExtendedSeriesFixture),
    ),
    http.get(`https://api.tvmaze.com/lookup/shows`, ({ request }) => {
      const searchParams = new URL(request.url).searchParams;

      if (
        searchParams.get("thetvdb") !==
        breakingBadOfficialOrderFixture.data.id.toString()
      ) {
        return HttpResponse.json(null, { status: 404 });
      }

      return HttpResponse.json(breakingBadTvMazeLookupFixture);
    }),
  );

  const result = await indexTVDBMediaItem({
    dataSources: dataSourceMap,
    event: {
      item,
    },
    logger,
    settings,
  });

  expect.assert(result);

  expect(result.item).toStrictEqual({
    id: item.id,
    imdbId: "tt0903747",
    type: "show",
    title: "Breaking Bad",
    genres: ["Drama", "Crime", "Thriller", "Western"],
    network: "AMC",
    country: "usa",
    language: "eng",
    aliases: {
      ara: ["اختلال ضال"],
      ces: ["Perníkový táta"],
      eng: ["breaking-bad"],
      est: ["Halvale teele"],
      heb: ["שובר שורות"],
      hrv: ["Na putu prema dolje"],
      hun: ["Totál szívás"],
      ita: ["Breaking Bad - Reazioni collaterali"],
      kor: ["브레이킹 배드"],
      por: ["Breaking Bad: Ruptura Total", "Ruptura Total"],
      rus: ["Во все тяжкие"],
      srp: ["Чиста хемија"],
      ukr: ["Пуститися берега"],
      zho: ["绝命毒师", "絕命毒師"],
    },
    contentRating: "tv-ma",
    posterUrl: "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
    status: "ended",
    seasons: {
      0: {
        episodes: [
          {
            absoluteNumber: 0,
            title: "Good Cop / Bad Cop",
            airedAt: "2009-02-18T02:00Z",
            contentRating: "tv-ma",
            runtime: 3,
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/3859781.jpg",
          },
          {
            contentRating: "tv-ma",
            title: "Wedding Day",
            airedAt: "2009-02-18T02:00Z",
            runtime: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/3859791.jpg",
            number: 2,
            absoluteNumber: 0,
          },
          {
            title: "TwaüghtHammër",
            airedAt: "2009-02-18T02:00Z",
            contentRating: "tv-ma",
            runtime: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/3859801.jpg",
            number: 3,
            absoluteNumber: 0,
          },
          {
            title: "Marie's Confession",
            airedAt: "2009-02-18T02:00Z",
            contentRating: "tv-ma",
            runtime: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/3859811.jpg",
            number: 4,
            absoluteNumber: 0,
          },
          {
            title: "The Break-In",
            airedAt: "2009-02-18T02:00Z",
            contentRating: "tv-ma",
            runtime: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/3859821.jpg",
            number: 5,
            absoluteNumber: 0,
          },
          {
            title: "Live Saul Cam",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 20,
            absoluteNumber: 0,
          },
          {
            title: "Fernando",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 21,
            absoluteNumber: 0,
          },
          {
            title: "Carl",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 22,
            absoluteNumber: 0,
          },
          {
            title: "Wendy",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 23,
            absoluteNumber: 0,
          },
          {
            title: "Badger",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 24,
            absoluteNumber: 0,
          },
          {
            title: "Wayfarer 515",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 25,
            absoluteNumber: 0,
          },
          {
            title: "Letters to Saul",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 26,
            absoluteNumber: 0,
          },
          {
            title: "Tiger Trouble? Better Call Saul!",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 27,
            absoluteNumber: 0,
          },
          {
            title: 'Saul Says: "Sue \'Em Now"',
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 28,
            absoluteNumber: 0,
          },
          {
            title: "Team S.C.I.E.N.C.E.",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 29,
            absoluteNumber: 0,
          },
          {
            title: "Fatty Fat Fat",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 30,
            absoluteNumber: 0,
          },
          {
            title: "Fighting for You",
            airedAt: null,
            contentRating: "tv-ma",
            runtime: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 31,
            absoluteNumber: 0,
          },
          {
            title: "Snow Globe: A Breaking Bad Short",
            airedAt: "2020-02-18T02:00Z",
            contentRating: "tv-ma",
            runtime: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/posters/81189-10.jpg",
            number: 32,
            absoluteNumber: 0,
          },
        ],
        number: 0,
        title: null,
      },
      1: {
        episodes: [
          {
            absoluteNumber: 1,
            airedAt: "2008-01-21T02:00Z",
            contentRating: "tv-ma",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6421d9584f9dd.jpg",
            runtime: 58,
            title: "Pilot",
          },
          {
            absoluteNumber: 2,
            airedAt: "2008-01-28T02:00Z",
            contentRating: "tv-ma",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642203f37c277.jpg",
            runtime: 48,
            title: "Cat's in the Bag...",
          },
          {
            absoluteNumber: 3,
            airedAt: "2008-02-11T02:00Z",
            contentRating: "tv-ma",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea716c6a773d.jpg",
            runtime: 48,
            title: "...And the Bag's in the River",
          },
          {
            absoluteNumber: 4,
            airedAt: "2008-02-18T02:00Z",
            contentRating: "tv-ma",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/64232be19ffa2.jpg",
            runtime: 48,
            title: "Cancer Man",
          },
          {
            absoluteNumber: 5,
            airedAt: "2008-02-25T02:00Z",
            contentRating: "tv-ma",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea71ca4d8cf8.jpg",
            runtime: 48,
            title: "Gray Matter",
          },
          {
            absoluteNumber: 6,
            airedAt: "2008-03-03T02:00Z",
            contentRating: "tv-ma",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea72a5bd991e.jpg",
            runtime: 48,
            title: "Crazy Handful of Nothin'",
          },
          {
            absoluteNumber: 7,
            airedAt: "2008-03-10T01:00Z",
            contentRating: "tv-ma",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea8700bb5d18.jpg",
            runtime: 48,
            title: "A No-Rough-Stuff-Type Deal",
          },
        ],
        number: 1,
        title: null,
      },
      2: {
        episodes: [
          {
            absoluteNumber: 8,
            airedAt: "2009-03-09T01:00Z",
            contentRating: "tv-ma",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea87588d39fc.jpg",
            runtime: 47,
            title: "Seven Thirty-Seven",
          },
          {
            absoluteNumber: 9,
            airedAt: "2009-03-16T01:00Z",
            contentRating: "tv-ma",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea89ad421a42.jpg",
            runtime: 46,
            title: "Grilled",
          },
          {
            absoluteNumber: 10,
            airedAt: "2009-03-23T01:00Z",
            contentRating: "tv-ma",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ea89d1b129f3.jpg",
            runtime: 47,
            title: "Bit by a Dead Bee",
          },
          {
            absoluteNumber: 11,
            airedAt: "2009-03-30T01:00Z",
            contentRating: "tv-ma",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdbf1815106.jpg",
            runtime: 47,
            title: "Down",
          },
          {
            absoluteNumber: 12,
            airedAt: "2009-04-06T01:00Z",
            contentRating: "tv-ma",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdc501c14f5.jpg",
            runtime: 47,
            title: "Breakage",
          },
          {
            absoluteNumber: 13,
            airedAt: "2009-04-13T01:00Z",
            contentRating: "tv-ma",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdc8791a975.jpg",
            runtime: 47,
            title: "Peekaboo",
          },
          {
            absoluteNumber: 14,
            airedAt: "2009-04-20T01:00Z",
            contentRating: "tv-ma",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdcdc7e746f.jpg",
            runtime: 47,
            title: "Negro y Azul",
          },
          {
            absoluteNumber: 15,
            airedAt: "2009-04-27T01:00Z",
            contentRating: "tv-ma",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebdd48aca19a.jpg",
            runtime: 47,
            title: "Better Call Saul",
          },
          {
            absoluteNumber: 16,
            airedAt: "2009-05-04T01:00Z",
            contentRating: "tv-ma",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebede40ebf91.jpg",
            runtime: 47,
            title: "4 Days Out",
          },
          {
            absoluteNumber: 17,
            airedAt: "2009-05-11T01:00Z",
            contentRating: "tv-ma",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebedf6e80794.jpg",
            runtime: 47,
            title: "Over",
          },
          {
            absoluteNumber: 18,
            airedAt: "2009-05-18T01:00Z",
            contentRating: "tv-ma",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebee9d56e81e.jpg",
            runtime: 47,
            title: "Mandala",
          },
          {
            absoluteNumber: 19,
            airedAt: "2009-05-25T01:00Z",
            contentRating: "tv-ma",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebeed67dcacb.jpg",
            runtime: 47,
            title: "Phoenix",
          },
          {
            absoluteNumber: 20,
            airedAt: "2009-06-01T01:00Z",
            contentRating: "tv-ma",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebeeecf13014.jpg",
            runtime: 48,
            title: "ABQ",
          },
        ],
        number: 2,
        title: null,
      },
      3: {
        episodes: [
          {
            absoluteNumber: 21,
            airedAt: "2010-03-22T01:00Z",
            contentRating: "tv-ma",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642c8e983cc69.jpg",
            runtime: 47,
            title: "No Más",
          },
          {
            absoluteNumber: 22,
            airedAt: "2010-03-29T01:00Z",
            contentRating: "tv-ma",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642cae4b49286.jpg",
            runtime: 47,
            title: "Caballo sin Nombre",
          },
          {
            absoluteNumber: 23,
            airedAt: "2010-04-05T01:00Z",
            contentRating: "tv-ma",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642d74fc96d80.jpg",
            runtime: 47,
            title: "I.F.T.",
          },
          {
            absoluteNumber: 24,
            airedAt: "2010-04-12T01:00Z",
            contentRating: "tv-ma",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642da9038a4b1.jpg",
            runtime: 47,
            title: "Green Light",
          },
          {
            absoluteNumber: 25,
            airedAt: "2010-04-19T01:00Z",
            contentRating: "tv-ma",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642dc2db9f454.jpg",
            runtime: 47,
            title: "Más",
          },
          {
            absoluteNumber: 26,
            airedAt: "2010-04-26T01:00Z",
            contentRating: "tv-ma",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf1d3fb3ff4.jpg",
            runtime: 47,
            title: "Sunset",
          },
          {
            absoluteNumber: 27,
            airedAt: "2010-05-03T01:00Z",
            contentRating: "tv-ma",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf237fb10b1.jpg",
            runtime: 47,
            title: "One Minute",
          },
          {
            absoluteNumber: 28,
            airedAt: "2010-05-10T01:00Z",
            contentRating: "tv-ma",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ebf24da09ad0.jpg",
            runtime: 47,
            title: "I See You",
          },
          {
            absoluteNumber: 29,
            airedAt: "2010-05-17T01:00Z",
            contentRating: "tv-ma",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642f365806330.jpg",
            runtime: 47,
            title: "Kafkaesque",
          },
          {
            absoluteNumber: 30,
            airedAt: "2010-05-24T01:00Z",
            contentRating: "tv-ma",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/642f367d1808f.jpg",
            runtime: 47,
            title: "Fly",
          },
          {
            absoluteNumber: 31,
            airedAt: "2010-05-31T01:00Z",
            contentRating: "tv-ma",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec2ea711fdc5.jpg",
            runtime: 47,
            title: "Abiquiu",
          },
          {
            absoluteNumber: 32,
            airedAt: "2010-06-07T01:00Z",
            contentRating: "tv-ma",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec2f2a8a7a3b.jpg",
            runtime: 47,
            title: "Half Measures",
          },
          {
            absoluteNumber: 33,
            airedAt: "2010-06-14T01:00Z",
            contentRating: "tv-ma",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6430a1fd84f79.jpg",
            runtime: 47,
            title: "Full Measure",
          },
        ],
        number: 3,
        title: null,
      },
      4: {
        episodes: [
          {
            absoluteNumber: 34,
            airedAt: "2011-07-18T01:00Z",
            contentRating: "tv-ma",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6431eb24c04af.jpg",
            runtime: 48,
            title: "Box Cutter",
          },
          {
            absoluteNumber: 35,
            airedAt: "2011-07-25T01:00Z",
            contentRating: "tv-ma",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6432fb7d85d01.jpg",
            runtime: 46,
            title: "Thirty-Eight Snub",
          },
          {
            absoluteNumber: 36,
            airedAt: "2011-08-01T01:00Z",
            contentRating: "tv-ma",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/64330d3336d8a.jpg",
            runtime: 47,
            title: "Open House",
          },
          {
            absoluteNumber: 37,
            airedAt: "2011-08-08T01:00Z",
            contentRating: "tv-ma",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec3219910251.jpg",
            runtime: 47,
            title: "Bullet Points",
          },
          {
            absoluteNumber: 38,
            airedAt: "2011-08-15T01:00Z",
            contentRating: "tv-ma",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643595909286e.jpg",
            runtime: 47,
            title: "Shotgun",
          },
          {
            absoluteNumber: 39,
            airedAt: "2011-08-22T01:00Z",
            contentRating: "tv-ma",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6435a700ddb2c.jpg",
            runtime: 47,
            title: "Cornered",
          },
          {
            absoluteNumber: 40,
            airedAt: "2011-08-29T01:00Z",
            contentRating: "tv-ma",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6435bcc005073.jpg",
            runtime: 47,
            title: "Problem Dog",
          },
          {
            absoluteNumber: 41,
            airedAt: "2011-09-05T01:00Z",
            contentRating: "tv-ma",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6437cc3d70968.jpg",
            runtime: 47,
            title: "Hermanos",
          },
          {
            absoluteNumber: 42,
            airedAt: "2011-09-12T01:00Z",
            contentRating: "tv-ma",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4384965fb5.jpg",
            runtime: 47,
            title: "Bug",
          },
          {
            absoluteNumber: 43,
            airedAt: "2011-09-19T01:00Z",
            contentRating: "tv-ma",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec43964e72b8.jpg",
            runtime: 47,
            title: "Salud",
          },
          {
            absoluteNumber: 44,
            airedAt: "2011-09-26T01:00Z",
            contentRating: "tv-ma",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6439730668d56.jpg",
            runtime: 47,
            title: "Crawl Space",
          },
          {
            absoluteNumber: 45,
            airedAt: "2011-10-03T01:00Z",
            contentRating: "tv-ma",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec43f0bd0393.jpg",
            runtime: 47,
            title: "End Times",
          },
          {
            absoluteNumber: 46,
            airedAt: "2011-10-10T01:00Z",
            contentRating: "tv-ma",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/6439a250a06ca.jpg",
            runtime: 50,
            title: "Face Off",
          },
        ],
        number: 4,
        title: null,
      },
      5: {
        episodes: [
          {
            absoluteNumber: 47,
            airedAt: "2012-07-16T01:00Z",
            contentRating: "tv-ma",
            number: 1,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec44a5282bb8.jpg",
            runtime: 43,
            title: "Live Free or Die",
          },
          {
            absoluteNumber: 48,
            airedAt: "2012-07-23T01:00Z",
            contentRating: "tv-ma",
            number: 2,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643a5dff8b925.jpg",
            runtime: 48,
            title: "Madrigal",
          },
          {
            absoluteNumber: 49,
            airedAt: "2012-07-30T01:00Z",
            contentRating: "tv-ma",
            number: 3,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643b0b02f2427.jpg",
            runtime: 48,
            title: "Hazard Pay",
          },
          {
            absoluteNumber: 50,
            airedAt: "2012-08-06T01:00Z",
            contentRating: "tv-ma",
            number: 4,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643c054d8f33a.jpg",
            runtime: 48,
            title: "Fifty-One",
          },
          {
            absoluteNumber: 51,
            airedAt: "2012-08-13T01:00Z",
            contentRating: "tv-ma",
            number: 5,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643c450d914f6.jpg",
            runtime: 48,
            title: "Dead Freight",
          },
          {
            absoluteNumber: 52,
            airedAt: "2012-08-20T01:00Z",
            contentRating: "tv-ma",
            number: 6,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec45d0ab85aa.jpg",
            runtime: 48,
            title: "Buyout",
          },
          {
            absoluteNumber: 53,
            airedAt: "2012-08-27T01:00Z",
            contentRating: "tv-ma",
            number: 7,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643d713000300.jpg",
            runtime: 48,
            title: "Say My Name",
          },
          {
            absoluteNumber: 54,
            airedAt: "2012-09-03T01:00Z",
            contentRating: "tv-ma",
            number: 8,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4628385493.jpg",
            runtime: 48,
            title: "Gliding Over All",
          },
          {
            absoluteNumber: 55,
            airedAt: "2013-08-12T01:00Z",
            contentRating: "tv-ma",
            number: 9,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643d9bb73189e.jpg",
            runtime: 48,
            title: "Blood Money",
          },
          {
            absoluteNumber: 56,
            airedAt: "2013-08-19T01:00Z",
            contentRating: "tv-ma",
            number: 10,
            posterPath:
              "https://artworks.thetvdb.com/banners/series/81189/episodes/5ec4787fbd5b3.jpg",
            runtime: 48,
            title: "Buried",
          },
          {
            absoluteNumber: 57,
            airedAt: "2013-08-26T01:00Z",
            contentRating: "tv-ma",
            number: 11,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643dc3212e518.jpg",
            runtime: 48,
            title: "Confessions",
          },
          {
            absoluteNumber: 58,
            airedAt: "2013-09-02T01:00Z",
            contentRating: "tv-ma",
            number: 12,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643eed7cc5a34.jpg",
            runtime: 48,
            title: "Rabid Dog",
          },
          {
            absoluteNumber: 59,
            airedAt: "2013-09-09T01:00Z",
            contentRating: "tv-ma",
            number: 13,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f05b447467.jpg",
            runtime: 47,
            title: "To'hajiilee",
          },
          {
            absoluteNumber: 60,
            airedAt: "2013-09-16T01:00Z",
            contentRating: "tv-ma",
            number: 14,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f13cf31542.jpg",
            runtime: 48,
            title: "Ozymandias",
          },
          {
            absoluteNumber: 61,
            airedAt: "2013-09-23T01:00Z",
            contentRating: "tv-ma",
            number: 15,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f2821d00fc.jpg",
            runtime: 55,
            title: "Granite State",
          },
          {
            absoluteNumber: 62,
            airedAt: "2013-09-30T01:00Z",
            contentRating: "tv-ma",
            number: 16,
            posterPath:
              "https://artworks.thetvdb.com/banners/episodes/81189/643f38bb24163.jpg",
            runtime: 55,
            title: "Felina",
          },
        ],
        number: 5,
        title: null,
      },
    },
  });
});

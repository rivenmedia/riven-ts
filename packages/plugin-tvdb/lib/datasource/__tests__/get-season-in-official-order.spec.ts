import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import breakingBadExtendedSeriesFixture from "../../__fixtures__/breaking-bad/extended-series.json" with { type: "json" };
import breakingBadOfficialOrderFixture from "../../__fixtures__/breaking-bad/official-order.json" with { type: "json" };
import { postLoginHandler } from "../../__generated__/handlers/postLoginHandler.ts";
import { it } from "../../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "../tvdb.datasource.ts";

const seriesId = breakingBadOfficialOrderFixture.data.id.toString();

it.beforeEach(({ server }) => {
  server.use(
    postLoginHandler(),
    http.get(
      `https://api4.thetvdb.com/v4/series/${seriesId}/episodes/official/eng`,
      () => HttpResponse.json(breakingBadOfficialOrderFixture),
    ),
    http.get(`https://api4.thetvdb.com/v4/series/${seriesId}/extended`, () =>
      HttpResponse.json(breakingBadExtendedSeriesFixture),
    ),
    http.get(
      "https://api4.thetvdb.com/v4/seasons/:id/translations/:language",
      ({ params }) => {
        if (params["id"] !== "30272" || params["language"] !== "eng") {
          return HttpResponse.json(
            { status: "failure", message: "Translation not found" },
            { status: 404 },
          );
        }

        return HttpResponse.json({
          status: "success",
          data: {
            language: "eng",
            overview:
              "Walter White, a chemistry teacher, discovers that he has cancer.",
          },
        });
      },
    ),
  );
});

it("returns the season with its episodes in order", async ({
  dataSourceMap,
}) => {
  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 1);

  expect(season).toStrictEqual(
    expect.objectContaining({
      rootId: seriesId,
      number: 1,
      title: "Season 1",
      overview:
        "Walter White, a chemistry teacher, discovers that he has cancer.",
      posterUrl: "https://artworks.thetvdb.com/banners/seasons/81189-1-3.jpg",
    }),
  );

  expect(season?.episodes.map((episode) => episode.number)).toStrictEqual([
    1, 2, 3, 4, 5, 6, 7,
  ]);

  expect(season?.episodes[0]).toStrictEqual({
    id: "349232",
    rootId: seriesId,
    number: 1,
    seasonNumber: 1,
    title: "Pilot",
    overview: expect.any(String),
    airDate: new Date("2008-01-20T00:00:00.000Z"),
    runtime: 58,
    posterUrl: expect.stringMatching(
      /^https:\/\/artworks\.thetvdb\.com\/banners\//u,
    ),
  });
});

it("returns the specials season", async ({ dataSourceMap }) => {
  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 0);

  expect(season?.number).toBe(0);
  expect(season?.episodes).toHaveLength(18);
});

it("returns null episode images when the episode has no image", async ({
  dataSourceMap,
}) => {
  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 0);

  expect(season?.episodes.some((episode) => episode.posterUrl === null)).toBe(
    true,
  );
});

it("returns null if the season does not exist", async ({ dataSourceMap }) => {
  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 99);

  expect(season).toBeNull();
});

it("doesn't look up the overview of seasons without one", async ({
  dataSourceMap,
  server,
}) => {
  const translationRequested = vi.fn<(url: string) => void>();

  server.events.on("request:start", ({ request }) => {
    if (request.url.includes("/translations/")) {
      translationRequested(request.url);
    }
  });

  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 0);

  expect(season?.overview).toBeNull();
  expect(translationRequested).not.toHaveBeenCalled();
});

it("returns a null overview if the season has no translation in the language", async ({
  dataSourceMap,
  server,
}) => {
  server.use(
    http.get(
      `https://api4.thetvdb.com/v4/series/${seriesId}/episodes/official/fra`,
      () => HttpResponse.json(breakingBadOfficialOrderFixture),
    ),
  );

  const tvdbApi = dataSourceMap.get(TvdbAPI);
  const season = await tvdbApi.getSeasonInOfficialOrder(seriesId, 1, "fra");

  expect(season?.overview).toBeNull();
});

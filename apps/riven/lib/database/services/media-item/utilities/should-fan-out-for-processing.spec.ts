import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { shouldFanOutForProcessing } from "./should-fan-out-for-processing.ts";

it("does not fan out a movie under either strategy", ({
  indexedMovieContext: { indexedMovie },
}) => {
  for (const downloadStrategy of ["torrent", "nzb"] as const) {
    expect(
      shouldFanOutForProcessing({
        item: indexedMovie,
        isPartialRequest: false,
        downloadStrategy,
        preferSeasonPacks: false,
      }),
    ).toBe(false);
  }
});

it("does not fan out an ended show under the torrent strategy (existing behavior)", ({
  scrapedShowContext: { scrapedShow },
}) => {
  scrapedShow.status = "ended";

  expect(
    shouldFanOutForProcessing({
      item: scrapedShow,
      isPartialRequest: false,
      downloadStrategy: "torrent",
      preferSeasonPacks: false,
    }),
  ).toBe(false);
});

it("fans out a continuing show under the torrent strategy (existing behavior)", ({
  scrapedShowContext: { scrapedShow },
}) => {
  scrapedShow.status = "continuing";

  expect(
    shouldFanOutForProcessing({
      item: scrapedShow,
      isPartialRequest: false,
      downloadStrategy: "torrent",
      preferSeasonPacks: false,
    }),
  ).toBe(true);
});

it("fans out an ended show under the torrent strategy when preferSeasonPacks is set (existing behavior)", ({
  scrapedShowContext: { scrapedShow },
}) => {
  scrapedShow.status = "ended";

  expect(
    shouldFanOutForProcessing({
      item: scrapedShow,
      isPartialRequest: false,
      downloadStrategy: "torrent",
      preferSeasonPacks: true,
    }),
  ).toBe(true);
});

it("ALWAYS fans out a show under the nzb strategy, even when ended (season packs are required)", ({
  scrapedShowContext: { scrapedShow },
}) => {
  scrapedShow.status = "ended";

  expect(
    shouldFanOutForProcessing({
      item: scrapedShow,
      isPartialRequest: false,
      downloadStrategy: "nzb",
      preferSeasonPacks: false,
    }),
  ).toBe(true);
});

it("does not fan out a season under the nzb strategy (it is scraped for a pack, not split here)", async ({
  scrapedShowContext: { scrapedShow },
}) => {
  const [season] = await scrapedShow.seasons.load();
  assert(season);

  expect(
    shouldFanOutForProcessing({
      item: season,
      isPartialRequest: false,
      downloadStrategy: "nzb",
      preferSeasonPacks: false,
    }),
  ).toBe(false);
});

it("fans out any item flagged as a partial request", ({
  indexedMovieContext: { indexedMovie },
}) => {
  expect(
    shouldFanOutForProcessing({
      item: indexedMovie,
      isPartialRequest: true,
      downloadStrategy: "torrent",
      preferSeasonPacks: false,
    }),
  ).toBe(true);
});

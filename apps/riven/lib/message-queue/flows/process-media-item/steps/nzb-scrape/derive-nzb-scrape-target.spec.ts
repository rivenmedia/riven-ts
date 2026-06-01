import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { deriveNzbScrapeTarget } from "./derive-nzb-scrape-target.ts";

it("returns all-null for a movie (no TV identifiers)", async ({
  indexedMovieContext: { indexedMovie },
}) => {
  const target = await deriveNzbScrapeTarget(indexedMovie);

  expect(target).toEqual({
    tvdbId: null,
    seasonNumber: null,
    episodeNumber: null,
  });
});

it("returns the show's tvdbId and no season/ep for a show", async ({
  scrapedShowContext: { scrapedShow },
}) => {
  const target = await deriveNzbScrapeTarget(scrapedShow);

  expect(target.tvdbId).toBe(scrapedShow.tvdbId);
  expect(target.seasonNumber).toBeNull();
  expect(target.episodeNumber).toBeNull();
});

it("returns the show's tvdbId and the season number for a season", async ({
  scrapedShowContext: { scrapedShow },
}) => {
  const [season] = await scrapedShow.seasons.load();
  assert(season);

  const target = await deriveNzbScrapeTarget(season);

  expect(target.tvdbId).toBe(scrapedShow.tvdbId);
  expect(target.seasonNumber).toBe(season.number);
  expect(target.episodeNumber).toBeNull();
});

it("returns the show's tvdbId plus season and ep for an episode", async ({
  scrapedShowContext: { scrapedShow },
}) => {
  const [season] = await scrapedShow.seasons.load();
  assert(season);
  const [episode] = season.episodes;
  assert(episode);

  const target = await deriveNzbScrapeTarget(episode);

  expect(target.tvdbId).toBe(scrapedShow.tvdbId);
  expect(target.seasonNumber).toBe(season.number);
  expect(target.episodeNumber).toBe(episode.number);
});

it("uses the parent SHOW's tvdbId, not the episode's own tvdbId", async ({
  scrapedShowContext: { scrapedShow },
}) => {
  const [season] = await scrapedShow.seasons.load();
  assert(season);
  const [episode] = season.episodes;
  assert(episode);

  // Diverge the episode's own id from the series id (in-memory). The helper
  // must still resolve the SERIES id via getShow() — that is what nzbgeek
  // tvsearch needs — never the episode-level tvdbId.
  episode.tvdbId = "999999-episode-level";

  const target = await deriveNzbScrapeTarget(episode);

  expect(target.tvdbId).toBe(scrapedShow.tvdbId);
  expect(target.tvdbId).not.toBe("999999-episode-level");
});

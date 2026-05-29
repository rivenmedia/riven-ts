import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("throws an error if no media items are provided", async ({
  services: { streamService },
}) => {
  await expect(() =>
    streamService.calculateItemsToReprocess(new Set()),
  ).rejects.toThrow(
    "Cannot determine items to reprocess: no media items provided",
  );
});

it("returns the original media item if it is a movie", async ({
  services: { streamService },
  completedMovieContext: { completedMovie },
}) => {
  const itemsToReprocess = await streamService.calculateItemsToReprocess(
    new Set([completedMovie]),
  );

  expect(itemsToReprocess.size).toBe(1);
  expect(itemsToReprocess.has(completedMovie)).toBe(true);
});

it("returns only the show if the media item is a show-like item and the show is also in the set of media items", async ({
  services: { streamService },
  completedShowContext: {
    completedShow,
    seasons: [season],
  },
}) => {
  expect.assert(season);

  const itemsToReprocess = await streamService.calculateItemsToReprocess(
    new Set([completedShow, season]),
  );

  expect(itemsToReprocess.size).toBe(1);
  expect(itemsToReprocess.has(completedShow)).toBe(true);
});

it("returns only the season if the list contains the season and all its episodes but not the show", async ({
  services: { streamService },
  completedShowContext: {
    seasons: [season],
  },
}) => {
  expect.assert(season);

  const episodes = await season.episodes.loadItems();

  const itemsToReprocess = await streamService.calculateItemsToReprocess(
    new Set([season, ...episodes]),
  );

  expect(itemsToReprocess.size).toBe(1);
  expect(itemsToReprocess.has(season)).toBe(true);
});

it("returns only the episode if the list does not contain its parent season", async ({
  services: { streamService },
  completedShowContext: {
    episodes: [episode],
  },
}) => {
  expect.assert(episode);

  const itemsToReprocess = await streamService.calculateItemsToReprocess(
    new Set([episode]),
  );

  expect(itemsToReprocess.size).toBe(1);
  expect(itemsToReprocess.has(episode)).toBe(true);
});

import { wrap } from "@mikro-orm/core";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("resets a movie item", async ({
  services,
  completedMovieContext: { completedMovie },
}) => {
  const resetItems =
    await services.mediaItemService.resetMediaItem(completedMovie);

  expect(resetItems).toHaveLength(1);
  expect(resetItems).toEqual(new Set([completedMovie]));
});

it("resets an episode item", async ({
  services,
  completedShowContext: {
    episodes: [episode],
  },
}) => {
  expect.assert(episode);

  const resetItems = await services.mediaItemService.resetMediaItem(episode);

  expect(resetItems).toHaveLength(1);
  expect(resetItems).toEqual(new Set([episode]));
});

it("resets a show item and all nested seasons and episodes", async ({
  services,
  completedShowContext: { completedShow },
}) => {
  const allSeasons = await completedShow.seasons.loadItems();
  const allEpisodes = await completedShow.getEpisodes();

  const resetItems =
    await services.mediaItemService.resetMediaItem(completedShow);

  const serialisedItems = resetItems
    .values()
    .map((item) => wrap(item).serialize())
    .toArray();

  expect(resetItems).toHaveLength(1 + allSeasons.length + allEpisodes.length);
  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      wrap(completedShow).serialize(),
      ...allSeasons.map((season) => wrap(season).serialize()),
      ...allEpisodes.map((episode) => wrap(episode).serialize()),
    ]),
  );
});

it("resets a season item and all nested episodes", async ({
  services,
  completedShowContext: {
    seasons: [season],
  },
}) => {
  expect.assert(season);

  const allEpisodes = await season.episodes.loadItems();

  const resetItems = await services.mediaItemService.resetMediaItem(season);
  const serialisedItems = resetItems
    .values()
    .map((item) => wrap(item).serialize())
    .toArray();

  expect(resetItems).toHaveLength(1 + allEpisodes.length);
  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      wrap(season).serialize(),
      ...allEpisodes.map((episode) => wrap(episode).serialize()),
    ]),
  );
});

it("does not reset the show when resetting a single season", async ({
  services,
  completedShowContext: {
    seasons: [season],
  },
}) => {
  expect.assert(season);

  const resetItems = await services.mediaItemService.resetMediaItem(season);
  const serialisedItems = resetItems
    .values()
    .map((item) => wrap(item).serialize())
    .toArray();

  expect(resetItems).toHaveLength(1 + season.episodes.count());
  expect(serialisedItems).not.toEqual(
    expect.arrayContaining([wrap(season.show).serialize()]),
  );
});

it("does not reset sibling seasons when resetting a single season", async ({
  services,
  completedShowContext: {
    seasons: [season, season2],
  },
}) => {
  expect.assert(season);
  expect.assert(season2);

  const resetItems = await services.mediaItemService.resetMediaItem(season);
  const serialisedItems = resetItems
    .values()
    .map((item) => wrap(item).serialize())
    .toArray();

  expect(resetItems).toHaveLength(1 + season.episodes.count());
  expect(serialisedItems).not.toEqual(
    expect.arrayContaining([wrap(season2).serialize()]),
  );
});

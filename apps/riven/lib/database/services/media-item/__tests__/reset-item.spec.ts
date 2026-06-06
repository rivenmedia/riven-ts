import { wrap } from "@mikro-orm/core";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

function serialiseItems(items: Set<MediaItem>) {
  return items
    .values()
    .map((item) => wrap(item).serialize({ fields: ["id", "state"] }))
    .toArray();
}

it("resets a movie item", async ({
  services,
  completedMovieContext: { completedMovie },
}) => {
  const resetItems =
    await services.mediaItemService.resetMediaItem(completedMovie);

  expect(resetItems.size).toBe(1);

  const serialisedItems = serialiseItems(resetItems);

  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: completedMovie.id,
        state: "indexed",
      }),
    ]),
  );
});

it("resets a show item and all nested seasons and episodes", async ({
  services,
  completedShowContext: { completedShow },
}) => {
  const allSeasons = await completedShow.seasons.loadItems();
  const allEpisodes = await completedShow.getEpisodes();

  const resetItems =
    await services.mediaItemService.resetMediaItem(completedShow);

  expect(resetItems.size).toBe(1 + allSeasons.length + allEpisodes.length);

  const serialisedItems = serialiseItems(resetItems);

  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: completedShow.id,
        state: "indexed",
      }),
      ...allSeasons.map((season) =>
        expect.objectContaining({
          id: season.id,
          state: "indexed",
        }),
      ),
      ...allEpisodes.map((episode) =>
        expect.objectContaining({
          id: episode.id,
          state: "indexed",
        }),
      ),
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

  expect(resetItems.size).toBe(1 + allEpisodes.length);

  const serialisedItems = serialiseItems(resetItems);

  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: season.id,
        state: "indexed",
      }),
      ...allEpisodes.map((episode) =>
        expect.objectContaining({
          id: episode.id,
          state: "indexed",
        }),
      ),
    ]),
  );
});

it("resets an episode item", async ({
  services,
  completedShowContext: {
    episodes: [episode],
  },
}) => {
  expect.assert(episode);

  const resetItems = await services.mediaItemService.resetMediaItem(episode);

  expect(resetItems.size).toBe(1);

  const serialisedItems = serialiseItems(resetItems);

  expect(serialisedItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: episode.id,
        state: "indexed",
      }),
    ]),
  );
});

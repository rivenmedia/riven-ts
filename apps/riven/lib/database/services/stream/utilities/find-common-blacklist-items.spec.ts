import { ref } from "@mikro-orm/core";
import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { findCommonBlacklistItems } from "./find-common-blacklist-items.ts";

it("throws an error if the item has no active stream", async ({
  em,
  completedMovieContext: { completedMovie },
}) => {
  completedMovie.activeStream = null;

  await expect(findCommonBlacklistItems(em, completedMovie)).rejects.toThrow();
});

describe("when the item is a movie", () => {
  it("only returns the input item", async ({
    em,
    completedMovieContext: { completedMovie },
  }) => {
    const items = await findCommonBlacklistItems(em, completedMovie);
    const itemIds = items.map((item) => item.id);

    expect(itemIds).toEqual(expect.arrayContaining([completedMovie.id]));
  });
});

describe("when the item is show-like", () => {
  it("returns the input item", async ({
    em,
    completedShowContext: { completedShow },
  }) => {
    const items = await findCommonBlacklistItems(em, completedShow);
    const itemIds = items.map((item) => item.id);

    expect(itemIds).toEqual(expect.arrayContaining([completedShow.id]));
  });

  it("returns child items that match the item's active stream", async ({
    em,
    completedShowContext: { completedShow },
  }) => {
    const items = await findCommonBlacklistItems(em, completedShow);
    const itemIds = items.map((item) => item.id);

    const episodes = await completedShow.getEpisodes();
    const seasons = await completedShow.seasons.loadItems();

    expect(itemIds).toEqual(
      expect.arrayContaining([
        completedShow.id,
        ...seasons.map((s) => s.id),
        ...episodes.map((e) => e.id),
      ]),
    );
  });

  it("does not return child items that do not match the item's active stream", async ({
    em,
    completedShowContext: {
      completedShow,
      seasons: [, nonMatchingSeason],
      streams: [, alternateStream],
    },
  }) => {
    expect.assert(nonMatchingSeason);
    expect.assert(alternateStream);

    nonMatchingSeason.activeStream = ref(alternateStream);

    const episodes = await nonMatchingSeason.episodes.loadItems();

    for (const episode of episodes) {
      em.persist(episode).assign(episode, {
        activeStream: ref(alternateStream),
      });
    }

    await em.flush();

    const items = await findCommonBlacklistItems(em, completedShow);
    const itemIds = items.map((item) => item.id);

    expect(itemIds).not.toEqual(
      expect.arrayContaining([
        nonMatchingSeason.id,
        ...episodes.map((e) => e.id),
      ]),
    );
  });
});

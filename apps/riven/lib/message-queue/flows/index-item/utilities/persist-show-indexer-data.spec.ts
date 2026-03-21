import { ItemRequest, Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, it } from "vitest";

import { database } from "../../../../database/database.ts";
import { persistShowIndexerData } from "./persist-show-indexer-data.ts";

it("returns the media item if processed successfully", async ({}) => {
  const requestedId = "tt1234567";

  const em = database.orm.em.fork();
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "test-user",
    imdbId: requestedId,
    tvdbId: "1234",
    type: "show",
    state: "requested",
  });

  await em.flush();

  const result = await persistShowIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Show",
      imdbId: requestedId,
      contentRating: "tv-14",
      genres: [],
      type: "show",
      firstAired: DateTime.fromISO("2020-01-01").toISO(),
      nextAired: null,
      network: "Test Network",
      seasons: [],
      status: "ended",
      keepUpdated: false,
    },
  });

  expect(result).instanceOf(Show);
  expect(result).toEqual(
    expect.objectContaining({
      id: 1,
      title: "Test Show",
      type: "show",
    }),
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item is in an incorrect state", async () => {
  const requestedId = "1234";

  const em = database.orm.em.fork();
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "test-user",
    imdbId: requestedId,
    tvdbId: "1234",
    type: "show",
    state: "completed",
  });

  await em.flush();

  await expect(
    persistShowIndexerData({
      item: {
        id: itemRequest.id,
        title: "Test Show",
        imdbId: requestedId,
        contentRating: "tv-14",
        genres: [],
        type: "show",
        firstAired: DateTime.fromISO("2020-01-01").toISO(),
        nextAired: null,
        network: "Test Network",
        seasons: [],
        status: "ended",
        keepUpdated: false,
      },
    }),
  ).rejects.toThrow(MediaItemIndexErrorIncorrectState);
});

it("updates the media item with the latest data if it already exists", async () => {
  const requestedId = "tt1234567";

  const em = database.orm.em.fork();
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "test-user",
    imdbId: requestedId,
    tvdbId: "1234",
    type: "show",
    state: "requested",
  });

  await em.flush();

  const initialShow = await persistShowIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Show",
      imdbId: requestedId,
      contentRating: "tv-14",
      genres: [],
      type: "show",
      firstAired: null,
      nextAired: null,
      network: "Test Network",
      seasons: {
        1: {
          number: 1,
          title: "Season 1",
          episodes: [
            {
              absoluteNumber: 0,
              contentRating: "unknown",
              number: 1,
              airedAt: null,
              title: "TBA",
              runtime: null,
            },
          ],
        },
      },
      status: "upcoming",
      keepUpdated: true,
    },
  });

  expect(wrap(initialShow).toJSON()).toEqual(
    expect.objectContaining({
      state: "unreleased",
      nextAirDate: null,
    }),
  );

  const episodes = await initialShow.getEpisodes();

  expect(episodes).toHaveLength(1);

  expect.assert(episodes[0]);

  expect(wrap(episodes[0]).toJSON()).toEqual(
    expect.objectContaining({
      title: "TBA",
      state: "unreleased",
      absoluteNumber: 0,
      contentRating: "unknown",
      releaseDate: null,
      year: null,
      runtime: null,
      number: 1,
    }),
  );

  const releasedAirDate = DateTime.utc().minus({ days: 1 });
  const nextAirDate = releasedAirDate.plus({ days: 7 });

  const updatedShow = await persistShowIndexerData({
    item: {
      id: itemRequest.id,
      title: "Test Show",
      imdbId: requestedId,
      contentRating: "tv-14",
      genres: [],
      type: "show",
      firstAired: releasedAirDate.toISO(),
      nextAired: nextAirDate.toISO(),
      network: "Test Network",
      seasons: {
        1: {
          number: 1,
          title: "Season 1",
          episodes: [
            {
              absoluteNumber: 1,
              contentRating: "tv-14",
              number: 1,
              airedAt: releasedAirDate.toISO(),
              title: "Episode 1",
              runtime: 60,
            },
          ],
        },
      },
      status: "continuing",
      keepUpdated: true,
    },
  });

  expect(wrap(updatedShow).toJSON()).toEqual(
    expect.objectContaining({
      state: "ongoing",
      nextAirDate: nextAirDate.toJSDate(),
    }),
  );

  const updatedEpisodes = await updatedShow.getEpisodes();

  expect(updatedEpisodes).toHaveLength(1);

  expect.assert(updatedEpisodes[0]);

  expect(wrap(updatedEpisodes[0]).toJSON()).toEqual(
    expect.objectContaining({
      title: "Episode 1",
      state: "indexed",
      absoluteNumber: 1,
      contentRating: "tv-14",
      year: releasedAirDate.year,
      releaseDate: releasedAirDate.toJSDate(),
      runtime: 60,
      number: 1,
    }),
  );

  const totalSeasonsCount = await updatedShow.seasons.loadCount();

  expect(totalSeasonsCount).toBe(1);
});

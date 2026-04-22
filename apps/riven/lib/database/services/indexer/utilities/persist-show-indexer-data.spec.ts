import { Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns the media item if processed successfully", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: requestedId,
    contentRating: "tv-14",
    genres: [],
    type: "show",
    network: "Test Network",
    seasons: [],
    status: "ended",
  });

  expect(result).instanceOf(Show);
  expect(result).toEqual(
    expect.objectContaining({
      title: "Test Show",
      type: "show",
    }),
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item is in an incorrect state", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const requestedId = "1234";

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "completed",
  });

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Show",
      imdbId: requestedId,
      contentRating: "tv-14",
      genres: [],
      type: "show",
      network: "Test Network",
      seasons: [],
      status: "ended",
    }),
  ).rejects.toThrow(MediaItemIndexErrorIncorrectState);
});

it("updates the media item with the latest data if it already exists", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  vi.useFakeTimers({
    now: DateTime.now().toJSDate(),
  });

  const requestedId = "tt1234567";

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const initialShow = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: requestedId,
    contentRating: "tv-14",
    aliases: {
      en: ["en-alias"],
    },
    genres: ["animation"],
    type: "show",
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
          {
            absoluteNumber: 0,
            contentRating: "unknown",
            number: 2,
            airedAt: null,
            title: "TBA",
            runtime: null,
          },
          {
            absoluteNumber: 0,
            contentRating: "unknown",
            number: 3,
            airedAt: null,
            title: "TBA",
            runtime: null,
          },
        ],
      },
    },
    status: "upcoming",
  });

  expect(wrap(initialShow).toJSON()).toEqual(
    expect.objectContaining({
      aliases: {
        en: ["en-alias"],
      },
      genres: ["animation"],
      state: "unreleased",
      nextAirDate: null,
    }),
  );

  const initialEpisodes = await initialShow.getEpisodes();

  expect(initialEpisodes).toHaveLength(3);

  expect.assert(initialEpisodes[0]);

  expect(wrap(initialEpisodes[0]).toJSON()).toEqual(
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

  const firstEpisodeAirDate = DateTime.now().plus({ months: 1 });

  const updatedUpcomingShow = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: requestedId,
    contentRating: "tv-14",
    aliases: {
      fr: ["fr-alias"],
    },
    genres: ["sci-fi"],
    type: "show",
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
            airedAt: firstEpisodeAirDate.toISO(),
            title: "Episode 1",
            runtime: 60,
          },
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 2,
            airedAt: firstEpisodeAirDate.plus({ weeks: 1 }).toISO(),
            title: "Episode 2",
            runtime: 60,
          },
          {
            absoluteNumber: 3,
            contentRating: "tv-14",
            number: 3,
            airedAt: firstEpisodeAirDate.plus({ weeks: 2 }).toISO(),
            title: "Episode 3",
            runtime: 60,
          },
        ],
      },
    },
    status: "upcoming",
  });

  expect(wrap(updatedUpcomingShow).toJSON()).toEqual(
    expect.objectContaining({
      aliases: {
        fr: ["fr-alias"],
      },
      genres: ["sci-fi"],
      state: "unreleased",
      nextAirDate: firstEpisodeAirDate.toJSDate(),
    }),
  );

  const updatedUpcomingEpisodes = await updatedUpcomingShow.getEpisodes();

  expect(updatedUpcomingEpisodes).toHaveLength(3);

  expect.assert(updatedUpcomingEpisodes[0]);

  expect(wrap(updatedUpcomingEpisodes[0]).toJSON()).toEqual(
    expect.objectContaining({
      title: "Episode 1",
      state: "unreleased",
      absoluteNumber: 1,
      contentRating: "tv-14",
      year: firstEpisodeAirDate.year,
      releaseDate: firstEpisodeAirDate.toJSDate(),
      runtime: 60,
      number: 1,
    }),
  );

  const totalSeasonsCount = await updatedUpcomingShow.seasons.loadCount();

  expect(totalSeasonsCount).toBe(1);

  vi.setSystemTime(firstEpisodeAirDate.plus({ days: 1 }).toJSDate());

  const updatedOngoingShow = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: requestedId,
    contentRating: "tv-14",
    genres: [],
    type: "show",
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
            airedAt: firstEpisodeAirDate.toISO(),
            title: "Episode 1",
            runtime: 60,
          },
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 2,
            airedAt: firstEpisodeAirDate.plus({ weeks: 1 }).toISO(),
            title: "Episode 2",
            runtime: 60,
          },
          {
            absoluteNumber: 3,
            contentRating: "tv-14",
            number: 3,
            airedAt: firstEpisodeAirDate.plus({ weeks: 2 }).toISO(),
            title: "Episode 3",
            runtime: 60,
          },
        ],
      },
    },
    status: "continuing",
  });

  expect(wrap(updatedOngoingShow).toJSON()).toEqual(
    expect.objectContaining({
      state: "ongoing",
      nextAirDate: firstEpisodeAirDate.plus({ weeks: 1 }).toJSDate(),
    }),
  );

  const updatedOngoingEpisodes = await updatedOngoingShow.getEpisodes();

  expect(updatedOngoingEpisodes).toHaveLength(3);

  expect.assert(updatedOngoingEpisodes[0]);

  expect(wrap(updatedOngoingEpisodes[0]).toJSON()).toEqual(
    expect.objectContaining({
      title: "Episode 1",
      state: "indexed",
      absoluteNumber: 1,
      contentRating: "tv-14",
      year: firstEpisodeAirDate.year,
      releaseDate: firstEpisodeAirDate.toJSDate(),
      runtime: 60,
      number: 1,
    }),
  );

  const seasons = await updatedOngoingShow.seasons.loadItems();

  expect(seasons).toHaveLength(1);

  expect.assert(seasons[0]);

  expect(wrap(seasons[0]).toJSON()).toEqual(
    expect.objectContaining({
      releaseDate: firstEpisodeAirDate.toJSDate(),
      year: firstEpisodeAirDate.year,
    }),
  );

  vi.setSystemTime(DateTime.now().plus({ weeks: 1 }).toJSDate());

  const updatedOngoingShowWeekTwo = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: requestedId,
    contentRating: "tv-14",
    genres: [],
    type: "show",
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
            airedAt: firstEpisodeAirDate.toISO(),
            title: "Episode 1",
            runtime: 60,
          },
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 2,
            airedAt: firstEpisodeAirDate.plus({ weeks: 1 }).toISO(),
            title: "Episode 2",
            runtime: 60,
          },
          {
            absoluteNumber: 3,
            contentRating: "tv-14",
            number: 3,
            airedAt: firstEpisodeAirDate.plus({ weeks: 2 }).toISO(),
            title: "Episode 3",
            runtime: 60,
          },
        ],
      },
    },
    status: "continuing",
  });

  expect(wrap(updatedOngoingShowWeekTwo).toJSON()).toEqual(
    expect.objectContaining({
      state: "ongoing",
      nextAirDate: firstEpisodeAirDate.plus({ weeks: 2 }).toJSDate(),
    }),
  );
});

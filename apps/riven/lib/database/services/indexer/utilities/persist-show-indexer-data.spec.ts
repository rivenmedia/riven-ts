import { Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import * as classValidator from "class-validator";
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
    now: DateTime.utc().toJSDate(),
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

  const firstEpisodeAirDate = DateTime.utc().plus({ months: 1 });

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

  vi.setSystemTime(DateTime.utc().plus({ weeks: 1 }).toJSDate());

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

it("throws MediaItemIndexError if tvdbId is missing", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    tvdbId: null,
    state: "requested",
  });

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Show",
      contentRating: "tv-14",
      genres: [],
      type: "show",
      network: "Test Network",
      seasons: [],
      status: "ended",
    }),
  ).rejects.toThrow(MediaItemIndexError);
});

it("returns existing show for requested_additional_seasons state", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
  });

  // First create the show
  await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    contentRating: "tv-14",
    genres: [],
    type: "show",
    network: "Test Network",
    seasons: {
      1: {
        number: 1,
        title: "Season 1",
        episodes: [],
      },
    },
    status: "ended",
  });

  // Manually set state to requested_additional_seasons
  const { ItemRequest } = await import("@repo/util-plugin-sdk/dto/entities");
  const { database } = await import("../../../../database/database.ts");
  const em2 = database.orm.em.fork();
  const ir = await em2.findOneOrFail(ItemRequest, { id: itemRequest.id });
  ir.state = "requested_additional_seasons";
  await em2.flush();

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    contentRating: "tv-14",
    genres: [],
    type: "show",
    network: "Test Network",
    seasons: {},
    status: "ended",
  });

  expect(result).toBeInstanceOf(Show);
});

it("indexes a show with partial season requests", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    seasons: [1],
  });

  const result = await indexerService.indexItem({
    id: itemRequest.id,
    title: "Partial Show",
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
            airedAt: DateTime.utc().minus({ days: 30 }).toISO(),
            title: "Episode 1",
            runtime: 45,
          },
        ],
      },
      2: {
        number: 2,
        title: "Season 2",
        episodes: [
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 1,
            airedAt: DateTime.utc().minus({ days: 7 }).toISO(),
            title: "S2E1",
            runtime: 45,
          },
        ],
      },
    },
    status: "ended",
  });

  expect(result).toBeInstanceOf(Show);
});

it("throws MediaItemIndexError when validation fails", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
  });

  const validationError = new classValidator.ValidationError();
  validationError.constraints = { isNotEmpty: "title should not be empty" };

  vi.spyOn(classValidator, "validateOrReject").mockRejectedValueOnce([
    validationError,
  ]);

  await expect(
    indexerService.indexItem({
      id: itemRequest.id,
      title: "Test Show",
      contentRating: "tv-14",
      genres: [],
      type: "show",
      network: "Test Network",
      seasons: [],
      status: "ended",
    }),
  ).rejects.toThrow(MediaItemIndexError);
});

it("backfills imdbId from show to item request when missing", async ({
  services: { indexerService },
  factories: { showItemRequestFactory },
  em,
}) => {
  const { ItemRequest } = await import("@repo/util-plugin-sdk/dto/entities");

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: null,
    state: "requested",
  });

  await indexerService.indexItem({
    id: itemRequest.id,
    title: "Test Show",
    imdbId: "tt8888888",
    contentRating: "tv-14",
    genres: [],
    type: "show",
    network: "Test Network",
    seasons: [],
    status: "ended",
  });

  em.clear();
  const updatedRequest = await em.findOneOrFail(ItemRequest, {
    id: itemRequest.id,
  });

  expect(updatedRequest.imdbId).toBe("tt8888888");
});

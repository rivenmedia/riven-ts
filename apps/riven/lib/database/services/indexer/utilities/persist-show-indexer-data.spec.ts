import {
  Episode,
  ItemRequest,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { wrap } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type { ShowIndexData } from "./persist-show-indexer-data.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

/**
 * Asserts that the counts of child items (episodes, seasons, and shows) for a given show match the expected values.
 *
 * As the show indexer upserts, it's important to verify that duplicates aren't created.
 *
 * @param em The entity manager instance.
 * @param showId The ID of the show.
 * @param param2 An object containing the expected counts of episodes, seasons, and shows.
 */
async function assertChildItemCounts(
  em: EntityManager,
  showId: UUID,
  {
    episodeCount,
    seasonCount,
    showCount,
  }: {
    showCount: number;
    seasonCount: number;
    episodeCount: number;
  },
) {
  await expect(
    em.count(Show, {
      id: showId,
    }),
  ).resolves.toBe(showCount);

  await expect(
    em.count(Season, {
      show: {
        id: showId,
      },
    }),
  ).resolves.toBe(seasonCount);

  await expect(
    em.count(Episode, {
      season: {
        show: {
          id: showId,
        },
      },
    }),
  ).resolves.toBe(episodeCount);
}

it("returns the show if processed successfully", async ({
  em,
  services: { indexerService },
  factories: { showItemRequestFactory },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const { item: result } = await indexerService.indexItem({
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
  expect(result).toStrictEqual(
    expect.objectContaining({
      title: "Test Show",
      type: "show",
    }),
  );

  await assertChildItemCounts(em, result.id, {
    showCount: 1,
    seasonCount: 0,
    episodeCount: 0,
  });
});

it("sets the item request's state to 'processing' if processed successfully", async ({
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const requestedId = "tt1234567";

  const itemRequest = await showItemRequestFactory.createOne({
    imdbId: requestedId,
    state: "requested",
  });

  const { item: result } = await indexerService.indexItem({
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
            airedAt: DateTime.utc().minus({ years: 1 }).toISO(),
            title: "Episode 1",
            runtime: 60,
          },
          {
            absoluteNumber: 2,
            contentRating: "tv-14",
            number: 2,
            airedAt: DateTime.utc()
              .minus({ years: 1 })
              .plus({ weeks: 1 })
              .toISO(),
            title: "Episode 2",
            runtime: 60,
          },
          {
            absoluteNumber: 3,
            contentRating: "tv-14",
            number: 3,
            airedAt: DateTime.utc()
              .minus({ years: 1 })
              .plus({ weeks: 2 })
              .toISO(),
            title: "Episode 3",
            runtime: 60,
          },
        ],
      },
    },
    status: "ended",
  });

  await expect(result.itemRequest.loadProperty("state")).resolves.toBe(
    "processing",
  );
});

it("throws a MediaItemIndexErrorIncorrectState error if the item request is in an incorrect state", async ({
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

it("updates the show and its children with the latest data if it has already been ingested", async ({
  em,
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

  const { item: initialShow, isReindex: initialIsReindex } =
    await indexerService.indexItem({
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

  expect(initialIsReindex).toBe(false);
  expect(wrap(initialShow).toJSON()).toStrictEqual(
    expect.objectContaining<Partial<Show>>({
      aliases: {
        en: ["en-alias"],
      },
      genres: ["animation"],
      state: "unreleased",
      nextAirDate: null,
    }),
  );

  await expect(initialShow.itemRequest.loadProperty("state")).resolves.toBe(
    "unreleased",
  );

  const initialEpisodes = await initialShow.getEpisodes();

  expect(initialEpisodes).toHaveLength(3);

  expect.assert(initialEpisodes[0]);

  expect(wrap(initialEpisodes[0]).toJSON()).toStrictEqual(
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

  const { item: updatedUpcomingShow, isReindex: updatedIsReindex } =
    await indexerService.indexItem({
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

  expect(updatedIsReindex).toBe(true);
  expect(wrap(updatedUpcomingShow).toJSON()).toStrictEqual(
    expect.objectContaining({
      aliases: {
        fr: ["fr-alias"],
      },
      genres: ["sci-fi"],
      state: "unreleased",
      nextAirDate: firstEpisodeAirDate.toJSDate(),
    }),
  );

  await expect(initialShow.itemRequest.loadProperty("state")).resolves.toBe(
    "unreleased",
  );

  await assertChildItemCounts(em, initialShow.id, {
    showCount: 1,
    seasonCount: 1,
    episodeCount: 3,
  });

  const updatedUpcomingEpisodes = await updatedUpcomingShow.getEpisodes();

  expect(updatedUpcomingEpisodes).toHaveLength(3);

  expect.assert(updatedUpcomingEpisodes[0]);

  expect(wrap(updatedUpcomingEpisodes[0]).toJSON()).toStrictEqual(
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

  const { item: updatedOngoingShow, isReindex: updatedOngoingIsReindex } =
    await indexerService.indexItem({
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

  expect(updatedOngoingIsReindex).toBe(true);
  expect(wrap(updatedOngoingShow).toJSON()).toStrictEqual(
    expect.objectContaining({
      state: "indexed",
      nextAirDate: firstEpisodeAirDate.plus({ weeks: 1 }).toJSDate(),
    }),
  );

  await expect(
    initialShow.itemRequest.loadProperty("state", { refresh: true }),
  ).resolves.toBe("ongoing");

  await assertChildItemCounts(em, initialShow.id, {
    showCount: 1,
    seasonCount: 1,
    episodeCount: 3,
  });

  const updatedOngoingEpisodes = await updatedOngoingShow.getEpisodes();

  expect(updatedOngoingEpisodes).toHaveLength(3);

  expect.assert(updatedOngoingEpisodes[0]);

  expect(wrap(updatedOngoingEpisodes[0]).toJSON()).toStrictEqual(
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

  expect(wrap(seasons[0]).toJSON()).toStrictEqual(
    expect.objectContaining({
      releaseDate: firstEpisodeAirDate.toJSDate(),
      year: firstEpisodeAirDate.year,
    }),
  );

  await assertChildItemCounts(em, initialShow.id, {
    showCount: 1,
    seasonCount: 1,
    episodeCount: 3,
  });

  vi.setSystemTime(DateTime.utc().plus({ weeks: 1 }).toJSDate());

  const {
    item: updatedOngoingShowWeekTwo,
    isReindex: updatedOngoingIsReindexWeekTwo,
  } = await indexerService.indexItem({
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

  expect(updatedOngoingIsReindexWeekTwo).toBe(true);
  expect(wrap(updatedOngoingShowWeekTwo).toJSON()).toStrictEqual(
    expect.objectContaining({
      state: "indexed",
      nextAirDate: firstEpisodeAirDate.plus({ weeks: 2 }).toJSDate(),
    }),
  );

  await expect(
    initialShow.itemRequest.loadProperty("state", { refresh: true }),
  ).resolves.toBe("ongoing");

  await assertChildItemCounts(em, initialShow.id, {
    showCount: 1,
    seasonCount: 1,
    episodeCount: 3,
  });

  vi.setSystemTime(DateTime.utc().plus({ weeks: 2 }).toJSDate());

  const {
    item: updatedOngoingShowWeekThree,
    isReindex: updatedOngoingIsReindexWeekThree,
  } = await indexerService.indexItem({
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
    status: "ended",
  });

  expect(updatedOngoingIsReindexWeekThree).toBe(true);
  expect(wrap(updatedOngoingShowWeekThree).toJSON()).toStrictEqual(
    expect.objectContaining({
      state: "indexed",
      status: "ended",
      nextAirDate: null,
    }),
  );

  await expect(
    initialShow.itemRequest.loadProperty("state", { refresh: true }),
  ).resolves.toBe("processing");

  await assertChildItemCounts(em, initialShow.id, {
    showCount: 1,
    seasonCount: 1,
    episodeCount: 3,
  });
});

const indexedSeason = (number: number) => ({
  number,
  title: null,
  episodes: [
    {
      absoluteNumber: number,
      contentRating: "tv-14" as const,
      number: 1,
      airedAt: DateTime.utc(2020, 1, number + 1).toISO(),
      title: `Episode 1 of season ${number.toString()}`,
      runtime: 30,
    },
  ],
});

const indexedShow = (
  id: UUID,
  overrides: Partial<Pick<ShowIndexData, "imdbId" | "seasons">> = {},
): ShowIndexData => ({
  id,
  title: "Test Show",
  imdbId: null,
  contentRating: "tv-14",
  genres: [],
  type: "show",
  network: "Test Network",
  status: "ended",
  seasons: {
    0: indexedSeason(0),
    1: indexedSeason(1),
    2: indexedSeason(2),
  },
  ...overrides,
});

const getRequestedSeasons = async (em: EntityManager, showId: UUID) => {
  const seasons = await em
    .fork()
    .find(Season, { show: showId }, { orderBy: { number: "asc" } });

  return Object.fromEntries(
    seasons.map(({ number, isRequested }) => [number, isRequested]),
  );
};

it("requests every season except specials when no seasons were requested", async ({
  em,
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    seasons: null,
  });

  const { item } = await indexerService.indexItem(indexedShow(itemRequest.id));

  await expect(getRequestedSeasons(em, item.id)).resolves.toStrictEqual({
    0: false,
    1: true,
    2: true,
  });
  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ isPartialRequest: false, seasons: null });
});

it("only requests the requested seasons of a partial request", async ({
  em,
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    seasons: [2],
  });

  const { item } = await indexerService.indexItem(indexedShow(itemRequest.id));

  await expect(getRequestedSeasons(em, item.id)).resolves.toStrictEqual({
    0: false,
    1: false,
    2: true,
  });

  const episodes = await em
    .fork()
    .find(Episode, { season: { show: item.id } }, { populate: ["season"] });

  expect(
    Object.fromEntries(
      episodes.map(({ season, isRequested }) => [
        season.getEntity().number,
        isRequested,
      ]),
    ),
  ).toStrictEqual({ 0: false, 1: false, 2: true });

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ isPartialRequest: true, seasons: [2] });
});

it("treats a request for every regular season as a full request", async ({
  em,
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    seasons: [1, 2],
  });

  await indexerService.indexItem(indexedShow(itemRequest.id));

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ isPartialRequest: false, seasons: null });
});

it("rejects a show request without a TVDB ID", async ({
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    tvdbId: null,
    imdbId: "tt1234567",
  });

  await expect(
    indexerService.indexItem(indexedShow(itemRequest.id)),
  ).rejects.toThrow("Item request is missing tvdbId");
});

it("fills in the item request's missing IMDB ID and passes it to the show's children", async ({
  em,
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    imdbId: null,
  });

  const { item } = await indexerService.indexItem(
    indexedShow(itemRequest.id, { imdbId: "tt7654321" }),
  );

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ imdbId: "tt7654321" });

  const seasons = await em.fork().find(Season, { show: item.id });
  const episodes = await em.fork().find(Episode, { season: { show: item.id } });

  expect(new Set(seasons.map(({ imdbId }) => imdbId))).toStrictEqual(
    new Set(["tt7654321"]),
  );
  expect(new Set(episodes.map(({ imdbId }) => imdbId))).toStrictEqual(
    new Set(["tt7654321"]),
  );
});

it("rejects indexed show data that fails validation", async ({
  em,
  factories: { showItemRequestFactory },
  services: { indexerService },
}) => {
  const itemRequest = await showItemRequestFactory.createOne({
    state: "requested",
    imdbId: null,
  });

  await expect(
    indexerService.indexItem(
      indexedShow(itemRequest.id, { imdbId: "not-an-imdb-id" }),
    ),
  ).rejects.toThrow(MediaItemIndexError);

  await expect(
    em.fork().findOneOrFail(ItemRequest, itemRequest.id),
  ).resolves.toMatchObject({ imdbId: null });
});

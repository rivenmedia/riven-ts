import { DateTime } from "luxon";
import { expect } from "vitest";

import { it as baseIt } from "../../../__tests__/test-context.ts";
import { Episode, ItemRequest, Season, Show } from "../index.ts";

const test = baseIt
  .extend("itemRequest", ({ em }) =>
    em.create(ItemRequest, {
      requestedBy: "@repo/plugin-test",
      state: "completed",
      type: "show",
    }),
  )
  .extend("show", async ({ em, itemRequest }) => {
    const show = em.create(Show, {
      title: "Test Show",
      fullTitle: "Test Show",
      contentRating: "tv-14",
      status: "ended",
      tvdbId: "1",
      itemRequest,
      isRequested: true,
      indexedAt: DateTime.utc().toJSDate(),
    });

    await em.flush();

    return show;
  });

test("getEpisodes() orders episodes by season number and then episode number", async ({
  em,
  show,
  itemRequest,
}) => {
  for (let seasonNumber = 1; seasonNumber <= 3; seasonNumber++) {
    const season = em.create(Season, {
      title: "Test Season",
      fullTitle: `Test Show - Season ${seasonNumber.toString()}`,
      isRequested: true,
      number: seasonNumber,
      show,
      itemRequest,
      tvdbId: "1",
      indexedAt: DateTime.utc().toJSDate(),
    });

    await em.flush();

    for (let episodeNumber = 1; episodeNumber <= 3; episodeNumber++) {
      const episode = em.create(Episode, {
        title: "Test Episode",
        number: episodeNumber,
        absoluteNumber: (seasonNumber - 1) * 3 + episodeNumber,
        fullTitle: `Test Show - Season ${seasonNumber.toString()} - Episode ${episodeNumber.toString()}`,
        isRequested: true,
        isSpecial: false,
        contentRating: "tv-14",
        indexedAt: DateTime.utc().toJSDate(),
        itemRequest,
        show,
        tvdbId: "1",
      });

      season.episodes.add(episode);
      show.episodes.add(episode);
    }

    show.seasons.add(season);
  }

  await em.flush();

  const episodes = await show.getEpisodes();

  expect(episodes).toStrictEqual([
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 1"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 2"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 3"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 2 - Episode 1"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 2 - Episode 2"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 2 - Episode 3"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 3 - Episode 1"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 3 - Episode 2"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 3 - Episode 3"),
    }),
  ]);
});

test("getUnreleasedEpisodes() returns all unreleased episodes", async ({
  em,
  show,
  itemRequest,
}) => {
  const episodesPerSeason = 3;

  const season = em.create(Season, {
    title: "Test Season",
    fullTitle: `Test Show - Season 1`,
    isRequested: true,
    number: 1,
    show,
    itemRequest,
    tvdbId: "1",
    indexedAt: DateTime.utc().toJSDate(),
  });

  await em.flush();

  const seasonReleaseDate = DateTime.utc().minus({ weeks: 1 });

  for (
    let episodeNumber = 1;
    episodeNumber <= episodesPerSeason;
    episodeNumber++
  ) {
    const episode = em.create(Episode, {
      title: "Test Episode",
      number: episodeNumber,
      absoluteNumber: episodeNumber,
      fullTitle: `Test Show - Season 1 - Episode ${episodeNumber.toString()}`,
      isRequested: true,
      isSpecial: false,
      contentRating: "tv-14",
      indexedAt: DateTime.utc().toJSDate(),
      itemRequest,
      show,
      tvdbId: "1",
      releaseDate: seasonReleaseDate
        .plus({ weeks: episodeNumber - 1 })
        .toJSDate(),
      state: episodeNumber === 1 ? "indexed" : "unreleased",
    });

    season.episodes.add(episode);
    show.episodes.add(episode);
  }

  show.seasons.add(season);

  await em.flush();

  const unreleasedEpisodes = await show.getUnreleasedEpisodes();

  expect(unreleasedEpisodes).toStrictEqual([
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 2"),
    }),
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 3"),
    }),
  ]);
});

test("getNextAiringEpisode() returns the next airing episode", async ({
  em,
  show,
  itemRequest,
}) => {
  const episodesPerSeason = 3;

  const season = em.create(Season, {
    title: "Test Season",
    fullTitle: `Test Show - Season 1`,
    isRequested: true,
    number: 1,
    show,
    itemRequest,
    tvdbId: "1",
    indexedAt: DateTime.utc().toJSDate(),
  });

  await em.flush();

  const seasonReleaseDate = DateTime.utc().minus({ weeks: 1 });

  for (
    let episodeNumber = 1;
    episodeNumber <= episodesPerSeason;
    episodeNumber++
  ) {
    const episode = em.create(Episode, {
      title: "Test Episode",
      number: episodeNumber,
      absoluteNumber: episodeNumber,
      fullTitle: `Test Show - Season 1 - Episode ${episodeNumber.toString()}`,
      isRequested: true,
      isSpecial: false,
      contentRating: "tv-14",
      indexedAt: DateTime.utc().toJSDate(),
      itemRequest,
      show,
      tvdbId: "1",
      releaseDate: seasonReleaseDate
        .plus({ weeks: episodeNumber - 1 })
        .toJSDate(),
      state: episodeNumber === 1 ? "indexed" : "unreleased",
    });

    season.episodes.add(episode);
    show.episodes.add(episode);
  }

  show.seasons.add(season);

  await em.flush();

  const nextAiringEpisode = await show.getNextAiringEpisode();

  expect(nextAiringEpisode).toStrictEqual(
    expect.objectContaining({
      fullTitle: expect.stringContaining("Season 1 - Episode 2"),
    }),
  );
});

test("getNextAiringEpisode() returns null if there are no upcoming episodes", async ({
  em,
  show,
  itemRequest,
}) => {
  const episodesPerSeason = 3;

  const season = em.create(Season, {
    title: "Test Season",
    fullTitle: `Test Show - Season 1`,
    isRequested: true,
    number: 1,
    show,
    itemRequest,
    tvdbId: "1",
    indexedAt: DateTime.utc().toJSDate(),
  });

  await em.flush();

  const seasonReleaseDate = DateTime.utc().minus({ years: 1 });

  for (
    let episodeNumber = 1;
    episodeNumber <= episodesPerSeason;
    episodeNumber++
  ) {
    const episode = em.create(Episode, {
      title: "Test Episode",
      number: episodeNumber,
      absoluteNumber: episodeNumber,
      fullTitle: `Test Show - Season 1 - Episode ${episodeNumber.toString()}`,
      isRequested: true,
      isSpecial: false,
      contentRating: "tv-14",
      indexedAt: DateTime.utc().toJSDate(),
      itemRequest,
      show,
      tvdbId: "1",
      releaseDate: seasonReleaseDate
        .plus({ weeks: episodeNumber - 1 })
        .toJSDate(),
      state: "indexed",
    });

    season.episodes.add(episode);
    show.episodes.add(episode);
  }

  show.seasons.add(season);

  await em.flush();

  const nextAiringEpisode = await show.getNextAiringEpisode();

  expect(nextAiringEpisode).toBeNull();
});

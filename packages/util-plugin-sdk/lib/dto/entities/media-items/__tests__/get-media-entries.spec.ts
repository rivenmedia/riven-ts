import { expect } from "vitest";

import { test } from "../../../../__tests__/test-context.ts";
import { Episode, ItemRequest, MediaEntry, Season, Show } from "../../index.ts";
import { Movie } from "../movie.entity.ts";

test("getMediaEntries() returns the associated media entry for a Movie media item", async ({
  em,
}) => {
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "movie",
  });

  const movie = em.create(Movie, {
    title: "Test Movie",
    fullTitle: "Test Movie",
    contentRating: "pg_13",
    tmdbId: "1",
    itemRequest,
    isRequested: true,
  });

  const mediaEntry = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-movie.mkv",
    plugin: "test",
    mediaItem: movie,
  });

  movie.filesystemEntries.add(mediaEntry);

  await em.flush();

  expect(await movie.getMediaEntries()).toEqual([mediaEntry]);
});

test("getMediaEntries() returns the associated media entries for a Show media item", async ({
  em,
}) => {
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    title: "Test Show",
    fullTitle: "Test Show",
    contentRating: "tv_14",
    status: "ended",
    tvdbId: "1",
    itemRequest,
    isRequested: true,
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 1",
    fullTitle: "Test Show - S01",
    number: 1,
    isSpecial: false,
    isRequested: true,
    itemRequest,
  });

  show.seasons.add(season);

  await em.flush();

  const episode1 = em.create(Episode, {
    title: "Episode 1",
    fullTitle: "Test Show - S01E01",
    number: 1,
    absoluteNumber: 1,
    contentRating: "tv_14",
    isRequested: true,
    itemRequest,
  });

  const episode2 = em.create(Episode, {
    title: "Episode 2",
    fullTitle: "Test Show - S01E02",
    number: 2,
    absoluteNumber: 2,
    contentRating: "tv_14",
    isRequested: true,
    itemRequest,
  });

  const mediaEntry1 = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-show-s01e01.mkv",
    plugin: "test",
    mediaItem: episode1,
  });

  const mediaEntry2 = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-show-s01e02.mkv",
    plugin: "test",
    mediaItem: episode2,
  });

  season.episodes.add(episode1, episode2);

  episode1.filesystemEntries.add(mediaEntry1);
  episode2.filesystemEntries.add(mediaEntry2);

  await em.flush();

  expect(await show.getMediaEntries()).toEqual([mediaEntry1, mediaEntry2]);
});

test("getMediaEntries() returns the associated media entries for a Season media item", async ({
  em,
}) => {
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    title: "Test Show",
    fullTitle: "Test Show",
    contentRating: "tv_14",
    status: "ended",
    tvdbId: "1",
    itemRequest,
    isRequested: true,
  });

  await em.flush();

  const season1 = em.create(Season, {
    title: "Season 1",
    fullTitle: "Test Show - S01",
    number: 1,
    isSpecial: false,
    isRequested: true,
    itemRequest,
  });

  const season2 = em.create(Season, {
    title: "Season 2",
    fullTitle: "Test Show - S02",
    number: 2,
    isSpecial: false,
    isRequested: true,
    itemRequest,
  });

  show.seasons.add(season1, season2);

  await em.flush();

  const season1Episode1 = em.create(Episode, {
    title: "Episode 1",
    fullTitle: "Test Show - S01E01",
    number: 1,
    absoluteNumber: 1,
    contentRating: "tv_14",
    isRequested: true,
    itemRequest,
  });

  const season2Episode1 = em.create(Episode, {
    title: "Episode 1",
    fullTitle: "Test Show - S02E01",
    number: 1,
    absoluteNumber: 2,
    contentRating: "tv_14",
    isRequested: true,
    itemRequest,
  });

  const season1Episode1MediaEntry = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-show-s01e01.mkv",
    plugin: "test",
    mediaItem: season1Episode1,
  });

  const season2Episode1MediaEntry = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-show-s02e01.mkv",
    plugin: "test",
    mediaItem: season2Episode1,
  });

  season1.episodes.add(season1Episode1);
  season2.episodes.add(season2Episode1);

  season1Episode1.filesystemEntries.add(season1Episode1MediaEntry);
  season2Episode1.filesystemEntries.add(season2Episode1MediaEntry);

  await em.flush();

  expect(await season1.getMediaEntries()).toEqual([season1Episode1MediaEntry]);
  expect(await season2.getMediaEntries()).toEqual([season2Episode1MediaEntry]);
});

test("getMediaEntries() returns the associated media entry for an Episode media item", async ({
  em,
}) => {
  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    title: "Test Show",
    fullTitle: "Test Show",
    contentRating: "tv_14",
    status: "ended",
    tvdbId: "1",
    itemRequest,
    isRequested: true,
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 1",
    fullTitle: "Test Show - S01",
    number: 1,
    isSpecial: false,
    isRequested: true,
    itemRequest,
  });

  show.seasons.add(season);

  await em.flush();

  const episode = em.create(Episode, {
    title: "Episode 1",
    fullTitle: "Test Show - S01E01",
    number: 1,
    absoluteNumber: 1,
    contentRating: "tv_14",
    isRequested: true,
    itemRequest,
  });

  const mediaEntry = em.create(MediaEntry, {
    fileSize: 123456,
    originalFilename: "test-show-s01e01.mkv",
    plugin: "test",
    mediaItem: episode,
  });

  season.episodes.add(episode);

  episode.filesystemEntries.add(mediaEntry);

  await em.flush();

  expect(await episode.getMediaEntries()).toEqual([mediaEntry]);
});

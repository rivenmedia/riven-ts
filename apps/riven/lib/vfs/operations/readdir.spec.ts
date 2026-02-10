import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities/index";
import { MovieContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import { ref } from "@mikro-orm/core";
import { expect, it, vi } from "vitest";

import { database } from "../../database/database.ts";
import { readDirSync } from "./readdir.ts";

it("returns persistent directory entries for the root path", async () => {
  const callback = vi.fn();

  readDirSync("/", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "movies",
      "shows",
    ]);
  });
});

it("returns all shows for the /shows path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "Ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    state: "Completed",
    number: 1,
    parent: ref(show),
  });

  await em.flush();

  const episode = em.create(Episode, {
    number: 1,
    season: ref(season),
    year: 2020,
    title: "Example Episode 1",
    state: "Downloaded",
    type: "episode",
    contentRating: "tv-14",
  });

  em.create(MediaEntry, {
    originalFilename: "Example Episode 1.mkv",
    fileSize: 123456789,
    provider: "@repo/plugin-test",
    mediaItem: ref(episode),
  });

  await em.flush();

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Show 1 (2020) {tvdb-1}",
    ]);
  });
});

it("returns all movies for the /movies path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const movie = em.create(Movie, {
    tmdbId: "1",
    year: 2020,
    title: "Example Movie 1",
    state: "Downloaded",
    contentRating: "unknown",
  });

  const mediaEntry = em.create(MediaEntry, {
    originalFilename: "Example Movie 1.mkv",
    fileSize: 987654321,
    provider: "@repo/plugin-test",
    mediaItem: ref(movie),
  });

  movie.filesystemEntries.add(mediaEntry);

  await em.flush();

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Movie 1 (2020) {tmdb-1}",
    ]);
  });
});

it("returns all seasons for a show path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "Ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      state: "Completed",
      number: i,
      parent: ref(show),
    });

    await em.flush();

    const episode = em.create(Episode, {
      number: 1,
      season: ref(season),
      year: 2020,
      title: "Example Episode 1",
      state: "Downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    em.create(MediaEntry, {
      originalFilename: "Example Episode 1.mkv",
      fileSize: 123456789,
      provider: "@repo/plugin-test",
      mediaItem: ref(episode),
    });
  }

  await em.flush();

  readDirSync("/shows/Example Show 1 (2020) {tvdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Season 01",
      "Season 02",
      "Season 03",
    ]);
  });
});

it("returns all episodes for a show season path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "Ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    state: "Completed",
    number: 1,
    parent: ref(show),
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const episode = em.create(Episode, {
      number: i,
      season: ref(season),
      year: 2020,
      title: `Example Episode ${i.toString().padStart(2, "0")}`,
      state: "Downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    const mediaEntry = em.create(MediaEntry, {
      originalFilename: `Example Episode ${i.toString().padStart(2, "0")}.mkv`,
      fileSize: 123456789,
      provider: "@repo/plugin-test",
      mediaItem: ref(episode),
    });

    episode.filesystemEntries.add(mediaEntry);
  }

  await em.flush();

  readDirSync("/shows/Example Show 1 (2020) {tvdb-1}/Season 01", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Show 1 (2020) {tvdb-1} - s01e01.mkv",
      "Example Show 1 (2020) {tvdb-1} - s01e02.mkv",
      "Example Show 1 (2020) {tvdb-1} - s01e03.mkv",
    ]);
  });
});

it("returns the media entry's filename when viewing a single movie's directory", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const movie = em.create(Movie, {
    tmdbId: "1",
    year: 2020,
    title: "Example Movie 1",
    state: "Downloaded",
    type: "movie",
    contentRating: MovieContentRating.enum.g,
  });

  const mediaEntry = em.create(MediaEntry, {
    originalFilename: "Example Movie 1.mkv",
    fileSize: 987654321,
    provider: "@repo/plugin-test",
    mediaItem: ref(movie),
  });

  await em.flush();

  readDirSync("/movies/Example Movie 1 (2020) {tmdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      mediaEntry.vfsFileName,
    ]);
  });
});

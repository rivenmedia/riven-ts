import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities/index";
import { MovieContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

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
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 01",
    year: 2020,
    state: "completed",
    number: 1,
  });

  show.seasons.add(season);

  await em.flush();

  const episode = em.create(Episode, {
    number: 1,
    year: 2020,
    title: "Example Episode 1",
    state: "downloaded",
    type: "episode",
    contentRating: "tv-14",
  });

  season.episodes.add(episode);

  await em.flush();

  em.create(MediaEntry, {
    originalFilename: "Example Episode 1.mkv",
    fileSize: 123456789,
    provider: "@repo/plugin-test",
    mediaItem: episode,
  });

  await em.flush();

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Show 1 (2020) {tvdb-1}",
    ]);
  });
});

it('does not return entries for the "all shows" path for shows that do not have any episodes with a media entry', async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 01",
    year: 2020,
    state: "completed",
    number: 1,
  });

  show.seasons.add(season);

  await em.flush();

  const episode = em.create(Episode, {
    number: 1,
    year: 2020,
    title: "Example Episode 1",
    state: "downloaded",
    type: "episode",
    contentRating: "tv-14",
  });

  season.episodes.add(episode);

  await em.flush();

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, []);
  });
});

it("returns all movies for the /movies path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  for (let i = 1; i <= 3; i++) {
    const movie = em.create(Movie, {
      tmdbId: i.toString(),
      year: 2020,
      title: `Example Movie ${i.toString().padStart(2, "0")}`,
      state: "downloaded",
      contentRating: "unknown",
    });

    em.create(MediaEntry, {
      originalFilename: `Example Movie ${i.toString().padStart(2, "0")}.mkv`,
      fileSize: 987654321,
      provider: "@repo/plugin-test",
      mediaItem: movie,
    });
  }

  await em.flush();

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Movie 01 (2020) {tmdb-1}",
      "Example Movie 02 (2020) {tmdb-2}",
      "Example Movie 03 (2020) {tmdb-3}",
    ]);
  });
});

it("returns all seasons for a single show path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      title: `Season ${i.toString().padStart(2, "0")}`,
      year: 2020,
      state: "completed",
      number: i,
    });

    show.seasons.add(season);

    await em.flush();

    const episode = em.create(Episode, {
      number: 1,
      year: 2020,
      title: "Example Episode 1",
      state: "downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    season.episodes.add(episode);

    await em.flush();

    em.create(MediaEntry, {
      originalFilename: "Example Episode 1.mkv",
      fileSize: 123456789,
      provider: "@repo/plugin-test",
      mediaItem: episode,
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

it("does not return entries for a season that does not have any episodes with a media entry", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      title: `Season ${i.toString().padStart(2, "0")}`,
      year: 2020,
      state: "completed",
      number: i,
    });

    show.seasons.add(season);

    await em.flush();

    const episode = em.create(Episode, {
      number: 1,
      year: 2020,
      title: "Example Episode 1",
      state: "downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    season.episodes.add(episode);

    await em.flush();

    if (i === 1) {
      em.create(MediaEntry, {
        originalFilename: "Example Episode 1.mkv",
        fileSize: 123456789,
        provider: "@repo/plugin-test",
        mediaItem: episode,
      });
    }
  }

  await em.flush();

  readDirSync("/shows/Example Show 1 (2020) {tvdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, ["Season 01"]);
  });
});

it("returns all episodes for a single season path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 01",
    year: 2020,
    state: "completed",
    number: 1,
  });

  show.seasons.add(season);

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const episode = em.create(Episode, {
      number: i,
      year: 2020,
      title: `Example Episode ${i.toString().padStart(2, "0")}`,
      state: "downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    season.episodes.add(episode);

    await em.flush();

    em.create(MediaEntry, {
      originalFilename: `Example Episode ${i.toString().padStart(2, "0")}.mkv`,
      fileSize: 123456789,
      provider: "@repo/plugin-test",
      mediaItem: episode,
    });
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

it("does not return entries for episodes that does not have a media entry when viewing a season path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    tvdbId: "1",
    title: "Example Show 1",
    year: 2020,
    state: "ongoing",
    releaseData: {},
    status: "continuing",
    contentRating: "tv-14",
  });

  await em.flush();

  const season = em.create(Season, {
    title: "Season 01",
    year: 2020,
    state: "completed",
    number: 1,
  });

  show.seasons.add(season);

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const episode = em.create(Episode, {
      number: i,
      year: 2020,
      title: `Example Episode ${i.toString().padStart(2, "0")}`,
      state: "downloaded",
      type: "episode",
      contentRating: "tv-14",
    });

    season.episodes.add(episode);

    await em.flush();

    if (i === 1) {
      em.create(MediaEntry, {
        originalFilename: `Example Episode ${i.toString().padStart(2, "0")}.mkv`,
        fileSize: 123456789,
        provider: "@repo/plugin-test",
        mediaItem: episode,
      });
    }
  }

  await em.flush();

  readDirSync("/shows/Example Show 1 (2020) {tvdb-1}/Season 01", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Show 1 (2020) {tvdb-1} - s01e01.mkv",
    ]);
  });
});

it("returns the media entry's filename when viewing a single movie's directory", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const movie = em.create(Movie, {
    tmdbId: "1",
    year: 2020,
    title: "Example Movie 01",
    state: "downloaded",
    type: "movie",
    contentRating: MovieContentRating.enum.g,
  });

  em.create(MediaEntry, {
    originalFilename: "Example Movie 01.mkv",
    fileSize: 987654321,
    provider: "@repo/plugin-test",
    mediaItem: movie,
  });

  await em.flush();

  readDirSync("/movies/Example Movie 01 (2020) {tmdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Movie 01 (2020) {tmdb-1}.mkv",
    ]);
  });
});

it('does not return entries for the "all movies" path when a movie does not have a media entry', async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  for (let i = 1; i <= 3; i++) {
    const movie = em.create(Movie, {
      tmdbId: i.toString(),
      year: 2020,
      title: `Example Movie ${i.toString().padStart(2, "0")}`,
      state: "downloaded",
      contentRating: "unknown",
    });

    if (i === 1) {
      em.create(MediaEntry, {
        originalFilename: `Example Movie ${i.toString().padStart(2, "0")}.mkv`,
        fileSize: 987654321,
        provider: "@repo/plugin-test",
        mediaItem: movie,
      });
    }
  }

  await em.flush();

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Movie 01 (2020) {tmdb-1}",
    ]);
  });
});

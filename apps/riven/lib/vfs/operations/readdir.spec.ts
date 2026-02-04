import {
  Episode,
  MediaEntry,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities/index";

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

  const expectedMediaEntries: MediaEntry[] = [
    database.mediaEntry.create(
      {
        id: 1,
        originalFilename: "Example Show 1.mkv",
        fileSize: 123456789,
        provider: "@repo/plugin-test",
      },
      { partial: true },
    ),
  ];

  const show = database.show.create(
    {
      tmdbId: "1",
      title: "Example Show 1",
      state: "Ongoing",
      releaseData: {},
    },
    { partial: true },
  );

  await em.flush();

  const season = database.season.create(
    {
      state: "Completed",
      number: 1,
      parent: ref(show),
    },
    { partial: true },
  );

  await em.flush();

  const expectedEpisodes: Episode[] = [
    database.episode.create(
      {
        number: 1,
        season: ref(season),
        tmdbId: "1",
        year: 2020,
        title: "Example Episode 1",
        state: "Downloaded",
        type: "episode",
      },
      { partial: true },
    ),
  ];

  await database.em.transactional(async (em) => {
    expectedMediaEntries.forEach((entry, i) => {
      if (expectedEpisodes[i]) {
        entry.mediaItem = ref(expectedEpisodes[i]);
      }

      em.persist(entry);
    });

    for (const episode of expectedEpisodes) {
      episode.filesystemEntries.add(expectedMediaEntries);

      em.persist(episode);
    }

    await em.flush();
  });

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Episode 1 (2020) {tmdb-1}",
    ]);
  });
});

it("returns all movies for the /movies path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const expectedMediaEntries: MediaEntry[] = [
    database.mediaEntry.create(
      {
        originalFilename: "Example Movie 1.mkv",
        fileSize: 987654321,
        provider: "@repo/plugin-test",
      },
      { partial: true },
    ),
  ];

  const expectedMovies: Movie[] = [
    database.movie.create(
      {
        tmdbId: "1",
        year: 2020,
        title: "Example Movie 1",
        state: "Downloaded",
        type: "movie",
      },
      { partial: true },
    ),
  ];

  for (const entry of expectedMediaEntries) {
    if (expectedMovies[0]) {
      entry.mediaItem = ref(expectedMovies[0]);
    }
  }

  em.persist(expectedMediaEntries);

  for (const movie of expectedMovies) {
    movie.filesystemEntries.add(expectedMediaEntries);
  }

  em.persist(expectedMovies);

  await em.flush();

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(0, [
      "Example Movie 1 (2020) {tmdb-1}",
    ]);
  });
});

it.todo("returns episodes for a show season path");

it("returns media entries for a known media item path", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const expectedMediaEntries: MediaEntry[] = [
    database.mediaEntry.create(
      {
        originalFilename: "Example Movie 1.mkv",
        fileSize: 987654321,
        provider: "@repo/plugin-test",
      },
      { partial: true },
    ),
  ];

  const expectedMovies: Movie[] = [
    database.movie.create(
      {
        tmdbId: "1",
        year: 2020,
        title: "Example Movie 1",
        state: "Downloaded",
        type: "movie",
      },
      { partial: true },
    ),
  ];

  for (const entry of expectedMediaEntries) {
    if (expectedMovies[0]) {
      entry.mediaItem = ref(expectedMovies[0]);
    }
  }

  for (const movie of expectedMovies) {
    movie.filesystemEntries.add(expectedMediaEntries);
  }

  em.persist(expectedMediaEntries);
  em.persist(expectedMovies);

  await em.flush();

  readDirSync("/movies/Example Movie 1 (2020) {tmdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      expectedMediaEntries.map((entry) => entry.path),
    );
  });
});

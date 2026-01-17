import { database } from "@repo/core-util-database/connection";
import {
  Episode,
  MediaEntry,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { expect, it, vi } from "vitest";

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

  const expectedMediaEntries: MediaEntry[] = [
    MediaEntry.create({
      id: 1,
      originalFilename: "Example Show 1.mkv",
    }),
  ];

  const expectedEpisodes: Episode[] = [
    Episode.create({
      id: 1,
      tmdbId: "1",
      year: 2020,
      title: "Example Episode 1",
      state: "Downloaded",
      type: "Episode",
    }),
  ];

  await database.manager.transaction(async (transactionalEntityManager) => {
    const savedEpisodes =
      await transactionalEntityManager.save(expectedEpisodes);

    for (const entry of expectedMediaEntries) {
      if (savedEpisodes[0]) {
        entry.mediaItem = savedEpisodes[0];
      }
    }

    const savedMediaEntries =
      await transactionalEntityManager.save(expectedMediaEntries);

    for (const episode of savedEpisodes) {
      episode.filesystemEntries = savedMediaEntries;
    }

    await transactionalEntityManager.save(savedEpisodes);
  });

  readDirSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      expectedEpisodes.map((show) => show.path),
    );
  });
});

it("returns all movies for the /movies path", async () => {
  const callback = vi.fn();

  const expectedMediaEntries: MediaEntry[] = [
    MediaEntry.create({
      id: 1,
      originalFilename: "Example Movie 1.mkv",
    }),
  ];

  const expectedMovies: Movie[] = [
    Movie.create({
      id: 1,
      tmdbId: "1",
      year: 2020,
      title: "Example Movie 1",
      state: "Downloaded",
      type: "Movie",
    }),
  ];

  await database.manager.transaction(async (transactionalEntityManager) => {
    const savedMovies = await transactionalEntityManager.save(expectedMovies);

    for (const entry of expectedMediaEntries) {
      if (savedMovies[0]) {
        entry.mediaItem = savedMovies[0];
      }
    }

    const savedMediaEntries =
      await transactionalEntityManager.save(expectedMediaEntries);

    for (const movie of savedMovies) {
      movie.filesystemEntries = savedMediaEntries;
    }

    await transactionalEntityManager.save(savedMovies);
  });

  readDirSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      expectedMovies.map((movie) => movie.path),
    );
  });
});

it.todo("returns episodes for a show season path");

it("returns media entries for a known media item path", async () => {
  const callback = vi.fn();

  const expectedMediaEntries: MediaEntry[] = [
    MediaEntry.create({
      id: 1,
      originalFilename: "Example Movie 1.mkv",
    }),
  ];

  const expectedMovies: Movie[] = [
    Movie.create({
      id: 1,
      tmdbId: "1",
      year: 2020,
      title: "Example Movie 1",
      state: "Downloaded",
      type: "Movie",
    }),
  ];

  await database.manager.transaction(async (transactionalEntityManager) => {
    const savedMovies = await transactionalEntityManager.save(expectedMovies);

    for (const entry of expectedMediaEntries) {
      if (savedMovies[0]) {
        entry.mediaItem = savedMovies[0];
      }
    }

    const savedMediaEntries =
      await transactionalEntityManager.save(expectedMediaEntries);

    for (const movie of savedMovies) {
      movie.filesystemEntries = savedMediaEntries;
    }

    await transactionalEntityManager.save(savedMovies);
  });

  readDirSync("/movies/Example Movie 1 (2020) {tmdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, string[]]>(
      0,
      expectedMediaEntries.map((entry) => entry.path),
    );
  });
});

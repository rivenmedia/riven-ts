import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";
import { expect, it, vi } from "vitest";

import { database } from "../../database/database.ts";
import { getattrSync, parseMode } from "./getattr.ts";

it("returns directory stats for the root directory", async () => {
  const callback = vi.fn();

  getattrSync("/", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 4,
    });
  });
});

it("returns ENOENT for ignored paths", async () => {
  const callback = vi.fn();

  getattrSync("/.Trash", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns ENOENT for hidden paths", async () => {
  const callback = vi.fn();

  getattrSync("/somefolder/.hidden", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns ENOENT for unknown paths", async () => {
  const callback = vi.fn();

  getattrSync("/unknownpath", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns file stats for movie files", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const mediaItem = em.create(Movie, {
    title: "Inception",
    year: 2010,
    state: "downloaded",
    tmdbId: "27205",
    contentRating: "pg-13",
  });

  await em.flush();

  const mediaEntry = em.create(MediaEntry, {
    fileSize: 2147483648,
    originalFilename: "Inception (2010) {tmdb-27205}.mkv",
    provider: "@repo/plugin-test",
    mediaItem,
  });

  mediaItem.filesystemEntries.add(mediaEntry);

  await em.flush();

  getattrSync(
    "/movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv",
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("file"),
      gid: 1000,
      uid: 1000,
      size: 2147483648,
      nlink: 1,
    });
  });
});

it("returns directory stats for /movies", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  for (let i = 1; i <= 3; i++) {
    const movie = em.create(Movie, {
      title: `Example Movie ${i.toString()}`,
      year: 2020,
      contentRating: "g",
      state: "downloaded",
      tmdbId: i.toString(),
    });

    await em.flush();

    const mediaEntry = em.create(MediaEntry, {
      fileSize: 1234567890,
      originalFilename: "Example Show.mkv",
      provider: "@repo/plugin-test",
      mediaItem: movie,
    });

    movie.filesystemEntries.add(mediaEntry);
  }

  await em.flush();

  getattrSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 5,
    });
  });
});

it("returns directory stats for /shows", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  for (let i = 1; i <= 3; i++) {
    const show = em.create(Show, {
      title: "Example Show",
      tvdbId: i.toString(),
      contentRating: "tv-14",
      year: 2026,
      state: "downloaded",
      status: "continuing",
    });

    await em.flush();

    const season = em.create(Season, {
      title: `Season ${i.toString().padStart(2, "0")}`,
      year: 2020,
      number: i,
      state: "downloaded",
    });

    show.seasons.add(season);

    await em.flush();

    const episode = em.create(Episode, {
      title: `Episode 01`,
      year: 2020,
      contentRating: "tv-14",
      number: 1,
      absoluteNumber: 1,
      state: "downloaded",
    });

    season.episodes.add(episode);

    const mediaEntry = em.create(MediaEntry, {
      fileSize: 1234567890,
      originalFilename: "Example Show.mkv",
      provider: "@repo/plugin-test",
      mediaItem: episode,
    });

    episode.filesystemEntries.add(mediaEntry);
  }

  await em.flush();

  getattrSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 5,
    });
  });
});

it("returns directory stats for single shows", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    title: "Example Show",
    tvdbId: "1",
    contentRating: "tv-14",
    year: 2026,
    state: "downloaded",
    status: "continuing",
  });

  await em.flush();

  for (let i = 1; i <= 10; i++) {
    const season = em.create(Season, {
      title: `Season ${i.toString().padStart(2, "0")}`,
      year: 2020,
      number: i,
      state: "downloaded",
    });

    show.seasons.add(season);

    await em.flush();

    const episode = em.create(Episode, {
      title: `Episode 01`,
      year: 2020,
      contentRating: "tv-14",
      number: 1,
      absoluteNumber: 1,
      state: "downloaded",
    });

    season.episodes.add(episode);

    const mediaEntry = em.create(MediaEntry, {
      fileSize: 1234567890,
      originalFilename: "Example Show.mkv",
      provider: "@repo/plugin-test",
      mediaItem: episode,
    });

    episode.filesystemEntries.add(mediaEntry);
  }

  await em.flush();

  getattrSync("/shows/Example Show (2026) {tvdb-1}", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 12,
    });
  });
});

it("returns directory stats for single seasons", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    title: "Example Show",
    tvdbId: "1",
    contentRating: "tv-14",
    year: 2026,
    state: "downloaded",
    status: "continuing",
  });

  await em.flush();

  const season = em.create(Season, {
    title: `Season 01`,
    year: 2020,
    number: 1,
    state: "downloaded",
  });

  show.seasons.add(season);

  await em.flush();

  for (let i = 1; i <= 10; i++) {
    const episode = em.create(Episode, {
      title: `Episode 01`,
      year: 2020,
      contentRating: "tv-14",
      number: 1,
      absoluteNumber: 1,
      state: "downloaded",
    });

    season.episodes.add(episode);

    const mediaEntry = em.create(MediaEntry, {
      fileSize: 1234567890,
      originalFilename: "Example Show.mkv",
      provider: "@repo/plugin-test",
      mediaItem: episode,
    });

    episode.filesystemEntries.add(mediaEntry);
  }

  await em.flush();

  getattrSync("/shows/Example Show (2026) {tvdb-1}/Season 01", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 2,
    });
  });
});

it("returns file stats for episodes", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const show = em.create(Show, {
    title: "Example Show",
    tvdbId: "1",
    contentRating: "tv-14",
    year: 2026,
    state: "downloaded",
    status: "continuing",
  });

  await em.flush();

  const season = em.create(Season, {
    title: `Season 01`,
    year: 2020,
    number: 1,
    state: "downloaded",
  });

  show.seasons.add(season);

  await em.flush();

  const episode = em.create(Episode, {
    title: `Episode 01`,
    year: 2020,
    contentRating: "tv-14",
    number: 1,
    absoluteNumber: 1,
    state: "downloaded",
  });

  season.episodes.add(episode);

  const mediaEntry = em.create(MediaEntry, {
    fileSize: 1234567890,
    originalFilename: "Example Show.mkv",
    provider: "@repo/plugin-test",
    mediaItem: episode,
  });

  episode.filesystemEntries.add(mediaEntry);

  await em.flush();

  getattrSync(
    "/shows/Example Show (2026) {tvdb-1}/Season 01/Example Show - s01e01.mkv",
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("file"),
      gid: 1000,
      uid: 1000,
      size: 1234567890,
      nlink: 1,
    });
  });
});

import Fuse from "@zkochan/fuse-native";
import fs from "node:fs";
import path from "node:path";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/test-context.ts";
import { PathInfo } from "../../database/services/vfs/schemas/path-info.schema.ts";
import { getattrSync } from "./getattr.ts";

const dirMode = fs.constants.S_IFDIR | 0o755;
const fileMode = fs.constants.S_IFREG | 0o644;

it("returns directory stats for the root directory", async () => {
  const callback = vi.fn();

  getattrSync("/", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
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

it("returns file stats for movie directories", async ({
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();
  const [mediaEntry] = await movie.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn();

  const pathInfo = PathInfo.parse(
    `/${mediaEntry.baseDirectory}/${mediaEntry.path}`,
  );

  getattrSync(pathInfo.dir, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: 0,
      nlink: 2,
    });
  });
});

it("returns file stats for movie files", async ({
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();
  const [mediaEntry] = await movie.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn();

  getattrSync(`/${mediaEntry.baseDirectory}/${mediaEntry.path}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: fileMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: mediaEntry.fileSize,
      nlink: 1,
    });
  });
});

it("returns directory stats for /movies", async ({
  seeders: { seedCompletedMovie },
}) => {
  await seedCompletedMovie(3);

  const callback = vi.fn();

  getattrSync("/movies", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: 0,
      nlink: 5,
    });
  });
});

it("returns directory stats for /shows", async ({
  seeders: { seedCompletedShow },
}) => {
  await seedCompletedShow(3);

  const callback = vi.fn();

  getattrSync("/shows", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: 0,
      nlink: 5,
    });
  });
});

it("returns directory stats for single shows", async ({
  completedShowContext: { completedShow },
}) => {
  const seasonsCount = await completedShow.seasons.loadCount();

  const callback = vi.fn();

  getattrSync(`/shows/{tvdb-${completedShow.tvdbId}}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: 0,
      nlink: 2 + seasonsCount,
    });
  });
});

it("returns directory stats for single seasons", async ({
  completedShowContext: { completedShow },
}) => {
  const callback = vi.fn();

  getattrSync(`/shows/{tvdb-${completedShow.tvdbId}}/Season 01`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: dirMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: 0,
      nlink: 2,
    });
  });
});

it("returns file stats for episodes", async ({
  seeders: { seedCompletedShow },
}) => {
  const { episodes: [episode] = [] } = await seedCompletedShow();

  expect.assert(episode);

  const [mediaEntry] = await episode.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn();

  getattrSync(`/${mediaEntry.baseDirectory}/${mediaEntry.path}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: fileMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: mediaEntry.fileSize,
      nlink: 1,
    });
  });
});

it("does not return file stats for movie files with non-matching extensions", async ({
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const [mediaEntry] = await movie.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn();

  const unknownFilePath = mediaEntry.path.replace(
    path.extname(mediaEntry.path),
    ".unknown-extension",
  );

  getattrSync(`/${mediaEntry.baseDirectory}/${unknownFilePath}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("does not return file stats for episode files with non-matching extensions", async ({
  seeders: { seedCompletedShow },
}) => {
  const { episodes: [episode] = [] } = await seedCompletedShow();

  expect.assert(episode);

  const [mediaEntry] = await episode.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn();

  const unknownFilePath = mediaEntry.path.replace(
    path.extname(mediaEntry.path),
    ".unknown-extension",
  );

  getattrSync(`/${mediaEntry.baseDirectory}/${unknownFilePath}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

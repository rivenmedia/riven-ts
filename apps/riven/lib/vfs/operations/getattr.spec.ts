import { Episode, MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../__tests__/test-context.ts";
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

it("returns file stats for movie files", async ({
  em,
  seeders: { seedCompletedMovie },
}) => {
  await seedCompletedMovie();

  const mediaEntry = await em.findOneOrFail(
    MediaEntry,
    { type: "media" },
    { populate: ["mediaItem"] },
  );

  const callback = vi.fn();

  getattrSync(`/${mediaEntry.baseDirectory}/${mediaEntry.path}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("file"),
      gid: 1000,
      uid: 1000,
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
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
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
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 5,
    });
  });
});

it("returns directory stats for single shows", async ({ completedShow }) => {
  const seasonsCount = await completedShow.seasons.loadCount();

  const callback = vi.fn();

  getattrSync(`/shows/{tvdb-${completedShow.tvdbId}}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("dir"),
      gid: 1000,
      uid: 1000,
      size: 0,
      nlink: 2 + seasonsCount,
    });
  });
});

it("returns directory stats for single seasons", async ({ completedShow }) => {
  const callback = vi.fn();

  getattrSync(`/shows/{tvdb-${completedShow.tvdbId}}/Season 01`, callback);

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

it("returns file stats for episodes", async ({
  em,
  seeders: { seedCompletedShow },
}) => {
  await seedCompletedShow();

  const episode = await em.findOneOrFail(
    Episode,
    { absoluteNumber: 1 },
    { populate: ["filesystemEntries.fileSize"] },
  );

  const mediaEntries = await episode.getMediaEntries();

  const callback = vi.fn();

  getattrSync(`/shows/{tvdb-${episode.tvdbId}}/Season 01/s01e01.mkv`, callback);

  await vi.waitFor(() => {
    expect.assert(mediaEntries[0]);

    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: parseMode("file"),
      gid: 1000,
      uid: 1000,
      size: mediaEntries[0].fileSize,
      nlink: 1,
    });
  });
});

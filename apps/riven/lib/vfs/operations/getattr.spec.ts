import { MediaEntry, Movie } from "@repo/util-plugin-sdk/dto/entities/index";

import { ref } from "@mikro-orm/core";
import Fuse from "@zkochan/fuse-native";
import { expect, it, vi } from "vitest";

import { database } from "../../database/database.ts";
import { getattrSync, parseMode } from "./getattr.ts";

it.for(["/", "/movies", "/shows"])(
  'returns a container directory for "%s"',
  async (path) => {
    const callback = vi.fn();

    getattrSync(path, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(null, {
        atime: expect.any(Date) as never,
        ctime: expect.any(Date) as never,
        mtime: expect.any(Date) as never,
        mode: parseMode("dir"),
        gid: 1000,
        uid: 1000,
        size: 0,
        blksize: 131072,
        blocks: 1,
        nlink: 2,
      });
    });
  },
);

it("returns EBADF for hidden paths", async () => {
  const callback = vi.fn();

  getattrSync("/.Trash", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EBADF);
  });
});

it("returns EBADF for trash paths", async () => {
  const callback = vi.fn();

  getattrSync("/somefolder/.hidden", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EBADF);
  });
});

it("returns ENOENT for unknown paths", async () => {
  const callback = vi.fn();

  getattrSync("/unknownpath", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns file stats for known files", async () => {
  const callback = vi.fn();

  const em = database.em.fork();

  const mediaEntry = new MediaEntry();

  mediaEntry.fileSize = 2147483648;
  mediaEntry.originalFilename = "Inception (2010) {tmdb-27205}.mkv";
  mediaEntry.provider = "@repo/plugin-test";

  const mediaItem = new Movie();

  mediaItem.title = "Inception";
  mediaItem.year = 2010;
  mediaItem.state = "Downloaded";
  mediaItem.tmdbId = "27205";
  mediaItem.filesystemEntries.add(mediaEntry);

  mediaEntry.mediaItem = ref(mediaItem);

  em.persist(mediaEntry);
  em.persist(mediaItem);

  await em.flush();

  getattrSync(
    "/movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv",
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date) as never,
      ctime: expect.any(Date) as never,
      mtime: expect.any(Date) as never,
      mode: parseMode("file"),
      gid: 1000,
      uid: 1000,
      size: 2147483648,
      blksize: 131072,
      blocks: 1,
      nlink: 1,
    });
  });
});

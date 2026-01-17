import { database } from "@repo/core-util-database/connection";
import { MediaEntry, Movie } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";
import { expect, it, vi } from "vitest";

import { getattrSync } from "./getattr.ts";

it.for(["/", "/movies", "/shows"])(
  'returns a container directory for "%s"',
  async (path) => {
    const callback = vi.fn();

    getattrSync(path, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith<[number, Fuse.Stats]>(0, {
        atime: expect.any(Number) as never,
        ctime: expect.any(Number) as never,
        mtime: expect.any(Number) as never,
        mode: 16877, // dir
        gid: 1000,
        uid: 1000,
        size: 0,
      });
    });
  },
);

it("skips hidden paths", async () => {
  const callback = vi.fn();

  getattrSync("/.Trash", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0, undefined);
  });
});

it("skips trash paths", async () => {
  const callback = vi.fn();

  getattrSync("/somefolder/.hidden", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0, undefined);
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

  const mediaItem = await database.manager.save(Movie, {
    title: "Inception",
    year: 2010,
    state: "Downloaded",
    tmdbId: "27205",
  });

  await database.manager.insert(MediaEntry, {
    mediaItem,
    fileSize: 2147483648 as never,
  });

  getattrSync(
    "/movies/Inception (2010) {tmdb-27205}/Inception (2010) {tmdb-27205}.mkv",
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith<[number, Fuse.Stats]>(0, {
      atime: expect.any(Number) as never,
      ctime: expect.any(Number) as never,
      mtime: expect.any(Number) as never,
      mode: 33188, // file
      gid: 1000,
      uid: 1000,
      size: 2147483648,
    });
  });
});

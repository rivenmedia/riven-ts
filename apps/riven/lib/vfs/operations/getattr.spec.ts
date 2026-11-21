import { SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";
import fs from "node:fs";
import path from "node:path";
import { expect, vi } from "vitest";
import z from "zod";

import { it } from "#__tests__/test-context.ts";
import { PathInfo } from "#database/services/vfs/schemas/path-info.schema.ts";

import { getattrSync } from "./getattr.ts";

import type { Services } from "#database/database.ts";
import type { UUID } from "node:crypto";

// oxlint-disable-next-line no-bitwise
const dirMode = fs.constants.S_IFDIR | 0o755;

// oxlint-disable-next-line no-bitwise
const fileMode = fs.constants.S_IFREG | 0o644;

type GetAttrCallback = Parameters<typeof getattrSync>[1];

it("returns directory stats for the root directory", async () => {
  const callback = vi.fn<GetAttrCallback>();

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

it("returns ENOENT for hidden paths", async () => {
  const callback = vi.fn<GetAttrCallback>();

  getattrSync("/somefolder/.hidden", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns ENOENT for unknown paths", async () => {
  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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
  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

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

  const callback = vi.fn<GetAttrCallback>();

  const unknownFilePath = mediaEntry.path.replace(
    path.extname(mediaEntry.path),
    ".unknown-extension",
  );

  getattrSync(`/${mediaEntry.baseDirectory}/${unknownFilePath}`, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

const saveSubtitle = async (
  subtitlesService: Services["subtitlesService"],
  mediaItemId: UUID,
  content: string,
) =>
  subtitlesService.saveSubtitles(
    mediaItemId,
    new Map([
      [
        "en",
        {
          language: "en",
          content,
          fileHash: "hash",
          fileSize: Buffer.byteLength(content),
          sourceProvider: "test-provider",
        },
      ],
    ]),
  );

it("returns file stats for subtitle files", async ({
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService },
}) => {
  const content = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";

  await saveSubtitle(subtitlesService, completedMovie.id, content);

  const subtitleEntry = await em.findOneOrFail(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { populate: ["mediaItem"] },
  );

  const callback = vi.fn<GetAttrCallback>();

  getattrSync(
    `/${subtitleEntry.baseDirectory}/${subtitleEntry.path}`,
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(null, {
      atime: expect.any(Date),
      ctime: expect.any(Date),
      mtime: expect.any(Date),
      mode: fileMode,
      gid: expect.any(Number),
      uid: expect.any(Number),
      size: Buffer.byteLength(content),
      nlink: 1,
    });
  });
});

it("returns ENOENT for subtitle files that do not exist", async ({
  completedMovieContext: { completedMovie },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  const callback = vi.fn<GetAttrCallback>();

  getattrSync(
    `/${mediaEntry.baseDirectory}/${mediaEntry.path}`.replace(
      /\.[^.]+$/u,
      ".en.srt",
    ),
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns ENOENT for movie files that do not exist", async () => {
  const callback = vi.fn<GetAttrCallback>();

  getattrSync(
    "/movies/Missing Movie (2020) {tmdb-999999}/Missing Movie (2020) {tmdb-999999}.mkv",
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("serves repeated lookups of the same path from the attribute cache", async ({
  completedMovieContext: { completedMovie },
  services,
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  const getEntryStat = vi.spyOn(services.vfsService, "getEntryStat");
  const moviePath = `/${mediaEntry.baseDirectory}/${mediaEntry.path}`;
  const firstCallback = vi.fn<GetAttrCallback>();
  const secondCallback = vi.fn<GetAttrCallback>();

  getattrSync(moviePath, firstCallback);

  await vi.waitFor(() => {
    expect(firstCallback).toHaveBeenCalledOnce();
  });

  getattrSync(moviePath, secondCallback);

  await vi.waitFor(() => {
    expect(secondCallback).toHaveBeenCalledOnce();
  });

  expect(secondCallback.mock.calls[0]).toStrictEqual(
    firstCallback.mock.calls[0],
  );
  expect(firstCallback.mock.calls[0]?.[1]).toMatchObject({
    size: mediaEntry.fileSize,
  });
  expect(getEntryStat).toHaveBeenCalledOnce();
});

it("returns ENOENT when the entry lookup fails validation", async ({
  services,
}) => {
  vi.spyOn(services.vfsService, "getEntryStat").mockRejectedValue(
    new z.ZodError([]),
  );

  const callback = vi.fn<GetAttrCallback>();

  getattrSync("/movies/Validation Failure", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.ENOENT);
  });
});

it("returns EIO when the entry lookup fails unexpectedly", async ({
  services,
}) => {
  vi.spyOn(services.vfsService, "getEntryStat").mockRejectedValue(
    new Error("Database unavailable"),
  );

  const callback = vi.fn<GetAttrCallback>();

  getattrSync("/movies/Unexpected Failure", callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EIO);
  });
});

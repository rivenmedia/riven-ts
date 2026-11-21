import Fuse from "@zkochan/fuse-native";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { runSingleJob } from "#message-queue/utilities/run-single-job.ts";
import { calculateFileChunks } from "#vfs/utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "#vfs/utilities/file-handle-map.ts";

import { openSync } from "./open.ts";

vi.mock(import("#message-queue/utilities/run-single-job.ts"));

type OpenCallback = Parameters<typeof openSync>[2];

const STREAM_LINK = "https://cdn.example.com/stream/movie.mkv";

const vfsPathFor = (entry: { baseDirectory: string; path: string }) =>
  `/${entry.baseDirectory}/${entry.path}`;

const openPath = async (path: string) => {
  const callback = vi.fn<OpenCallback>();

  openSync(path, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledOnce();
  });

  return callback.mock.calls[0] ?? [];
};

const it = baseIt.extend(
  "mediaEntry",
  async ({ completedMovieContext: { completedMovie } }) => {
    const [mediaEntry] = await completedMovie.getMediaEntries();

    expect.assert(mediaEntry);

    return mediaEntry;
  },
);

it.beforeEach(() => {
  fdToFileHandleMeta.clear();
  fileNameToFdCountMap.clear();
  fileNameToFileChunkCalculationsMap.clear();
});

it("opens a media file using its cached stream link", async ({
  mediaEntry,
  services: { streamService },
}) => {
  await streamService.saveStreamLink(mediaEntry.id, STREAM_LINK, 60);

  const path = vfsPathFor(mediaEntry);
  const [error, fd] = await openPath(path);

  expect(error).toBe(0);
  expect.assert(fd !== undefined);

  expect(fdToFileHandleMeta.get(fd)).toStrictEqual({
    type: "media",
    fileSize: mediaEntry.fileSize,
    filePath: path,
    fileBaseName: path.split("/").at(-1),
    originalFileName: mediaEntry.originalFilename,
    url: STREAM_LINK,
  });

  expect(
    fileNameToFileChunkCalculationsMap.get(mediaEntry.originalFilename),
  ).toStrictEqual(
    calculateFileChunks(mediaEntry.originalFilename, mediaEntry.fileSize),
  );

  expect(fileNameToFdCountMap.get(mediaEntry.originalFilename)).toBe(1);
  expect(runSingleJob).not.toHaveBeenCalled();
});

it("assigns a new file descriptor to each open of the same file", async ({
  mediaEntry,
  services: { streamService },
}) => {
  await streamService.saveStreamLink(mediaEntry.id, STREAM_LINK, 60);

  const path = vfsPathFor(mediaEntry);
  const [, firstFd] = await openPath(path);
  const [, secondFd] = await openPath(path);

  expect.assert(firstFd !== undefined && secondFd !== undefined);

  expect(secondFd).not.toBe(firstFd);
  expect([...fdToFileHandleMeta.keys()]).toStrictEqual([firstFd, secondFd]);
  expect(fileNameToFdCountMap.get(mediaEntry.originalFilename)).toBe(2);
});

it("requests a stream link when none is cached", async ({ mediaEntry }) => {
  vi.mocked(runSingleJob).mockResolvedValue(STREAM_LINK);

  const [error, fd] = await openPath(vfsPathFor(mediaEntry));

  expect(error).toBe(0);
  expect.assert(fd !== undefined);

  expect(fdToFileHandleMeta.get(fd)).toMatchObject({ url: STREAM_LINK });

  expect(runSingleJob).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ mediaEntryId: mediaEntry.id }),
    }),
    10_000,
  );
});

it("fails with EIO when the stream link request fails", async ({
  mediaEntry,
}) => {
  vi.mocked(runSingleJob).mockRejectedValue(new Error("Job timed out"));

  const [error, fd] = await openPath(vfsPathFor(mediaEntry));

  expect(error).toBe(Fuse.EIO);
  expect(fd).toBeUndefined();
  expect(fdToFileHandleMeta.size).toBe(0);
  expect(fileNameToFdCountMap.size).toBe(0);
});

it("fails with ENOENT when no media entry matches the path", async () => {
  const [error] = await openPath(
    "/movies/Unknown Movie (2020) {tmdb-999999}/Unknown Movie (2020) {tmdb-999999}.mkv",
  );

  expect(error).toBe(Fuse.ENOENT);
  expect(fdToFileHandleMeta.size).toBe(0);
});

it("fails with EIO for a path outside the VFS directories", async () => {
  const [error] = await openPath("/unknown/file.mkv");

  expect(error).toBe(Fuse.EIO);
});

it("opens a subtitle file with its content", async ({
  completedMovieContext: { completedMovie },
  em,
  services: { subtitlesService },
}) => {
  const content = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";

  await subtitlesService.saveSubtitles(
    completedMovie.id,
    new Map([
      [
        "en",
        {
          language: "en",
          content,
          fileHash: "hash",
          fileSize: content.length,
          sourceProvider: "test-provider",
        },
      ],
    ]),
  );

  const { SubtitleEntry } = await import("@repo/util-plugin-sdk/dto/entities");
  const subtitleEntry = await em.findOneOrFail(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { populate: ["mediaItem"] },
  );

  const path = vfsPathFor(subtitleEntry);
  const [error, fd] = await openPath(path);

  expect(error).toBe(0);
  expect.assert(fd !== undefined);

  expect(fdToFileHandleMeta.get(fd)).toStrictEqual({
    type: "subtitle",
    fileSize: Buffer.byteLength(content),
    filePath: path,
    fileBaseName: path.split("/").at(-1),
    contentBuffer: Buffer.from(content, "utf8"),
  });

  expect(fileNameToFdCountMap.size).toBe(0);
});

it("fails with ENOENT when no subtitle matches the path", async ({
  mediaEntry,
}) => {
  const [error] = await openPath(
    vfsPathFor(mediaEntry).replace(/\.[^.]+$/u, ".en.srt"),
  );

  expect(error).toBe(Fuse.ENOENT);
  expect(fdToFileHandleMeta.size).toBe(0);
});

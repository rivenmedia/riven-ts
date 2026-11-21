import Fuse from "@zkochan/fuse-native";
import Undici from "undici";
import { expect, it, vi } from "vitest";

import { calculateFileChunks } from "#vfs/utilities/chunks/calculate-file-chunks.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "#vfs/utilities/file-handle-map.ts";

import { releaseSync } from "./release.ts";

import type { Dispatcher } from "undici";

type ReleaseCallback = Parameters<typeof releaseSync>[2];

const fileName = "movie.mkv";
const fileSize = 1024 * 1024 * 1024;

const releaseFd = async (fd: number) => {
  const callback = vi.fn<ReleaseCallback>();

  releaseSync(`/movies/${fileName}`, fd, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledOnce();
  });

  return callback.mock.calls[0]?.[0];
};

const openMediaFd = (fd: number) => {
  fdToFileHandleMeta.set(fd, {
    type: "media",
    fileSize,
    filePath: `/movies/${fileName}`,
    fileBaseName: fileName,
    originalFileName: fileName,
    url: `http://example.com/${fileName}`,
  });
  fdToCurrentStreamPositionMap.set(fd, 1024);
  fdToPreviousReadPositionMap.set(fd, 512);
  fileNameToFdCountMap.set(
    fileName,
    (fileNameToFdCountMap.get(fileName) ?? 0) + 1,
  );
};

const createResponse = (dump: () => Promise<void>) =>
  Promise.resolve({ body: { dump } } as unknown as Dispatcher.ResponseData);

const expectFdReleased = (fd: number) => {
  for (const map of [
    fdToFileHandleMeta,
    fdToResponsePromiseMap,
    fdToCurrentStreamPositionMap,
    fdToPreviousReadPositionMap,
  ]) {
    expect(map.has(fd)).toBe(false);
  }
};

it.beforeEach(() => {
  for (const map of [
    fdToFileHandleMeta,
    fdToResponsePromiseMap,
    fdToCurrentStreamPositionMap,
    fdToPreviousReadPositionMap,
    fileNameIsFetchingLinkMap,
    fileNameToFdCountMap,
    fileNameToFileChunkCalculationsMap,
  ]) {
    map.clear();
  }

  fileNameToFileChunkCalculationsMap.set(
    fileName,
    calculateFileChunks(fileName, fileSize),
  );
  fileNameIsFetchingLinkMap.set(fileName, false);
});

it("clears the file name mappings when the last file descriptor is released", async () => {
  openMediaFd(1);

  await expect(releaseFd(1)).resolves.toBe(0);

  expectFdReleased(1);
  expect(fileNameToFdCountMap.has(fileName)).toBe(false);
  expect(fileNameToFileChunkCalculationsMap.has(fileName)).toBe(false);
  expect(fileNameIsFetchingLinkMap.has(fileName)).toBe(false);
});

it("keeps the file name mappings while other file descriptors reference the file", async () => {
  openMediaFd(1);
  openMediaFd(2);

  await expect(releaseFd(1)).resolves.toBe(0);

  expectFdReleased(1);
  expect(fdToFileHandleMeta.has(2)).toBe(true);
  expect(fdToCurrentStreamPositionMap.get(2)).toBe(1024);
  expect(fileNameToFdCountMap.get(fileName)).toBe(1);
  expect(fileNameToFileChunkCalculationsMap.has(fileName)).toBe(true);
  expect(fileNameIsFetchingLinkMap.has(fileName)).toBe(true);
});

it("leaves the file name mappings alone when releasing a subtitle", async () => {
  openMediaFd(1);

  fdToFileHandleMeta.set(2, {
    type: "subtitle",
    fileSize: 5,
    filePath: "/movies/movie.en.srt",
    fileBaseName: "movie.en.srt",
    contentBuffer: Buffer.from("hello"),
  });

  await expect(releaseFd(2)).resolves.toBe(0);

  expect(fdToFileHandleMeta.has(2)).toBe(false);
  expect(fileNameToFdCountMap.get(fileName)).toBe(1);
  expect(fileNameToFileChunkCalculationsMap.has(fileName)).toBe(true);
});

it("succeeds when releasing an unknown file descriptor", async () => {
  openMediaFd(1);

  await expect(releaseFd(99)).resolves.toBe(0);

  expect(fdToFileHandleMeta.has(1)).toBe(true);
  expect(fileNameToFdCountMap.get(fileName)).toBe(1);
});

it("drains the in-flight response before releasing", async () => {
  const dump = vi.fn<() => Promise<void>>().mockResolvedValue();

  openMediaFd(1);
  fdToResponsePromiseMap.set(1, createResponse(dump));

  await expect(releaseFd(1)).resolves.toBe(0);

  expect(dump).toHaveBeenCalledOnce();
  expectFdReleased(1);
});

it("ignores aborted requests when draining the in-flight response", async () => {
  openMediaFd(1);
  fdToResponsePromiseMap.set(
    1,
    createResponse(async () =>
      Promise.reject(new Undici.errors.RequestAbortedError()),
    ),
  );

  await expect(releaseFd(1)).resolves.toBe(0);

  expectFdReleased(1);
});

it("fails with EIO when draining the in-flight response fails", async () => {
  openMediaFd(1);
  fdToResponsePromiseMap.set(
    1,
    createResponse(async () => Promise.reject(new Error("socket hang up"))),
  );

  await expect(releaseFd(1)).resolves.toBe(Fuse.EIO);
});

it("clears the file name mappings when the file has no tracked descriptor count", async () => {
  openMediaFd(1);
  fileNameToFdCountMap.delete(fileName);

  await expect(releaseFd(1)).resolves.toBe(0);

  expect(fileNameToFdCountMap.has(fileName)).toBe(false);
  expect(fileNameToFileChunkCalculationsMap.has(fileName)).toBe(false);
});

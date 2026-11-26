import Fuse from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { expect, it as baseIt, vi } from "vitest";

import { withReadContext } from "#vfs/__tests__/with-read-context.ts";
import { ChunkMetadata } from "#vfs/schemas/chunk.schema.ts";
import { chunkCache } from "#vfs/utilities/chunk-cache.ts";
import { fdToCurrentStreamPositionMap } from "#vfs/utilities/file-handle-map.ts";

import { waitForChunk } from "./wait-for-chunk.ts";

import type BodyReadable from "undici/types/readable.ts";

const chunk = ChunkMetadata.parse({
  fileName: "movie.mkv",
  index: 0,
  start: 0,
  end: 7,
});

const it = baseIt
  .extend(
    "spyOnAbortSignalTimeout",
    () => () => vi.spyOn(AbortSignal, "timeout"),
  )
  .extend(
    "createReader",
    () => () =>
      new Readable({
        read() {
          /* data is pushed by each test */
        },
      }) as unknown as BodyReadable.default & Readable,
  );

it.beforeEach(() => {
  chunkCache.clear();
  fdToCurrentStreamPositionMap.clear();
  fdToCurrentStreamPositionMap.set(1, 100);
});

it("reads the chunk once enough data arrives and advances the stream position", async ({
  createReader,
}) => {
  const reader = createReader();
  const data = Buffer.from("abcdefghij");

  const result = withReadContext(async () => waitForChunk(reader, chunk));

  setImmediate(() => {
    reader.push(data);
  });

  await expect(result).resolves.toStrictEqual({
    chunk: data.subarray(0, chunk.size),
    fetchedFromCache: false,
  });

  expect(fdToCurrentStreamPositionMap.get(1)).toBe(100 + chunk.size);
});

it("returns the chunk cached by another read whilst waiting without advancing the stream position", async ({
  createReader,
}) => {
  const reader = createReader();
  const cached = Buffer.from("cached!!");

  const result = withReadContext(async () => waitForChunk(reader, chunk));

  chunkCache.set(chunk.cacheKey, cached);

  await expect(result).resolves.toStrictEqual({
    chunk: cached,
    fetchedFromCache: true,
  });

  expect(fdToCurrentStreamPositionMap.get(1)).toBe(100);
});

it("aborts waiting for the chunk when a seek is detected", async ({
  createReader,
}) => {
  const reader = createReader();
  const seekController = new AbortController();

  const result = withReadContext(async () => waitForChunk(reader, chunk), {
    seekController,
  });

  seekController.abort();

  await expect(result).rejects.toMatchObject({
    name: "SeekDetectedError",
    errorCode: Fuse.EIO,
  });
});

it("leaves the stream data unread once a seek has been detected", async ({
  createReader,
}) => {
  const reader = createReader();
  const seekController = new AbortController();

  reader.push(Buffer.from("abcdefgh"));
  seekController.abort();

  await expect(
    withReadContext(async () => waitForChunk(reader, chunk), {
      seekController,
    }),
  ).rejects.toMatchObject({ name: "SeekDetectedError" });

  // The retried read must receive this data from the same stream position
  expect(reader.readableLength).toBe(chunk.size);
  expect(fdToCurrentStreamPositionMap.get(1)).toBe(100);
});

it("discards a chunk cached by another read when a seek is detected whilst waiting", async ({
  createReader,
}) => {
  const reader = createReader();
  const seekController = new AbortController();

  const result = withReadContext(async () => waitForChunk(reader, chunk), {
    seekController,
  });

  chunkCache.set(chunk.cacheKey, Buffer.from("cached!!"));
  seekController.abort();

  await expect(result).rejects.toMatchObject({ name: "SeekDetectedError" });
});

it("fails with EIO when the stream is aborted before the chunk arrives", async ({
  createReader,
}) => {
  const reader = createReader();

  reader.destroy();

  await expect(
    withReadContext(async () => waitForChunk(reader, chunk)),
  ).rejects.toMatchObject({
    name: "FuseError",
    errorCode: Fuse.EIO,
    message: expect.stringContaining(
      `Stream was aborted before chunk could be read ${chunk.rangeLabel}`,
    ),
  });
});

it("fails with ETIMEDOUT when the chunk does not arrive in time", async ({
  spyOnAbortSignalTimeout,
  createReader,
}) => {
  spyOnAbortSignalTimeout().mockReturnValue(AbortSignal.abort());

  const reader = createReader();

  await expect(
    withReadContext(async () => waitForChunk(reader, chunk)),
  ).rejects.toMatchObject({
    name: "FuseError",
    errorCode: Fuse.ETIMEDOUT,
    message: expect.stringContaining(
      `Timed out waiting for chunk ${chunk.rangeLabel}`,
    ),
  });
});

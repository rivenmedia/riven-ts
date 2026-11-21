import Fuse from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import Undici from "undici";
import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { config } from "#vfs/config.ts";
import { chunkCache } from "#vfs/utilities/chunk-cache.ts";
import { calculateFileChunks } from "#vfs/utilities/chunks/calculate-file-chunks.ts";
import { createChunkCacheKey } from "#vfs/utilities/chunks/create-chunk-cache-key.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameToFileChunkCalculationsMap,
} from "#vfs/utilities/file-handle-map.ts";
import { createStreamRequest } from "#vfs/utilities/requests/create-stream-request.ts";
import { withVfsOperationContext } from "#vfs/utilities/vfs-operation-context.ts";

import type { VfsOperationContext } from "#vfs/utilities/vfs-operation-context.ts";
import type { MockAgent } from "undici";

const fileName = "movie.mkv";

function setupRangeInterceptor(
  agent: MockAgent,
  range: readonly [number, number | undefined],
) {
  const mockPool = agent.get("http://example.com");

  const size = range[1] === undefined ? undefined : range[1] - range[0] + 1;
  const responseBuffer = Buffer.alloc(size ?? config.chunkSize);

  responseBuffer.set(randomBytes(responseBuffer.byteLength));

  mockPool
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (rangeHeader === `bytes=${range.join("-")}`) {
        return {
          statusCode: 206,
          data: responseBuffer,
        };
      }

      return {
        statusCode: 416,
        data: "",
      };
    })
    .times(2);

  return responseBuffer;
}

it.beforeEach(() => {
  fdToFileHandleMeta.clear();
  fdToResponsePromiseMap.clear();
  fdToCurrentStreamPositionMap.clear();
  fileNameToFileChunkCalculationsMap.clear();
  fdToPreviousReadPositionMap.clear();

  const fileSize = 1024 * 1024 * 1024 * 10; // 10 GB

  fdToFileHandleMeta.set(0, {
    type: "media",
    fileSize,
    filePath: `/files/${fileName}`,
    fileBaseName: fileName,
    originalFileName: fileName,
    url: `http://example.com/files/${fileName}`,
  });

  fileNameToFileChunkCalculationsMap.set(
    fileName,
    calculateFileChunks(fileName, fileSize),
  );

  chunkCache.clear();
});

it("fetches the header chunk if the requested range is entirely within the header chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  const responseBuffer = setupRangeInterceptor(
    mockAgent,
    fileChunkCalculations.headerChunk.range,
  );

  const length = 64;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 0, buffer, length, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(responseBuffer.subarray(0, length))).toBe(true);

  expect(chunkCache.has(fileChunkCalculations.headerChunk.cacheKey)).toBe(true);
});

it("fetches the footer chunk if the requested range is entirely within the footer chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  const responseBuffer = setupRangeInterceptor(
    mockAgent,
    fileChunkCalculations.footerChunk.range,
  );

  const length = 64;

  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(
    fileName,
    0,
    buffer,
    length,
    fileChunkCalculations.footerChunk.range[0],
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(responseBuffer.subarray(0, length))).toBe(true);

  expect(chunkCache.has(fileChunkCalculations.footerChunk.cacheKey)).toBe(true);
});

it("correctly calculates offsets when copying chunk data into the buffer", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  const length = 64;
  const offset = 1024;

  const responseBuffer = setupRangeInterceptor(
    mockAgent,
    fileChunkCalculations.footerChunk.range,
  );

  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(
    fileName,
    0,
    buffer,
    length,
    fileChunkCalculations.footerChunk.range[0] + offset,
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(responseBuffer.subarray(offset, offset + length))).toBe(
    true,
  );
});

it("offsets the first chunk by the size of the header chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  const length = 64;

  const responseBuffer = setupRangeInterceptor(mockAgent, [
    fileChunkCalculations.headerChunk.size,
    undefined,
  ]);

  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(
    fileName,
    0,
    buffer,
    length,
    fileChunkCalculations.headerChunk.size,
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(responseBuffer.subarray(0, length))).toBe(true);
});

it("reads data across multiple chunks, utilising the chunk cache where possible", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const cachedChunk = Buffer.alloc(
    config.headerSize,
    randomBytes(config.headerSize),
  );

  chunkCache.set(
    createChunkCacheKey(fileName, 0, config.headerSize - 1),
    cachedChunk,
  );

  const responseBuffer = setupRangeInterceptor(mockAgent, [262_144, undefined]);

  const length = 131_072; // 128 KB

  const position = 196_608;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 0, buffer, length, position, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(
    buffer.equals(
      Buffer.concat([cachedChunk, responseBuffer]).subarray(
        position,
        position + length,
      ),
    ),
  ).toBe(true);

  expect(
    chunkCache.has(
      createChunkCacheKey(
        fileName,
        config.headerSize,
        config.headerSize + config.chunkSize - 1,
      ),
    ),
  ).toBe(true);
});

it("performs a one-off scan when receiving a read outside the scan tolerance limit during playback", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  fdToPreviousReadPositionMap.set(0, config.chunkSize * 10); // 10MB

  const length = 32_768; // 32 KB
  const position = config.chunkSize * 100; // 100MB

  const responseBuffer = setupRangeInterceptor(mockAgent, [
    position,
    position + length - 1,
  ]);

  const buffer = Buffer.alloc(length);
  const callback = vi.fn<() => void>().mockReturnValue();

  readSync(fileName, 0, buffer, length, position, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(responseBuffer)).toBe(true);

  expect(chunkCache.size).toBe(0);
});

it("saves a copy of each chunk to the cache when reading during playback within the scan tolerance limit", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");
  const fd = 0;

  fdToPreviousReadPositionMap.set(fd, config.chunkSize * 100); // 10MB

  const length = 131_072;
  const position = 104_988_672;

  const firstChunkResponseBuffer = Buffer.alloc(
    config.chunkSize,
    randomBytes(config.chunkSize),
  );

  const secondChunkResponseBuffer = Buffer.alloc(
    config.chunkSize,
    randomBytes(config.chunkSize),
  );

  mockAgent
    .get("http://example.com")
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (rangeHeader === `bytes=104071168-`) {
        return {
          statusCode: 206,
          data: Buffer.concat([
            firstChunkResponseBuffer,
            secondChunkResponseBuffer,
          ]),
        };
      }

      return {
        statusCode: 416,
        data: "",
      };
    });

  const firstChunkRange = [
    104_071_168,
    104_071_168 + config.chunkSize - 1,
  ] as const;

  const fileHandle = fdToFileHandleMeta.get(0);

  expect.assert(fileHandle?.type === "media");

  withVfsOperationContext(
    {
      operationName: "read",
      fd,
    } as Extract<VfsOperationContext, { operationName: "read" }>,
    () => {
      fdToResponsePromiseMap.set(
        fd,
        createStreamRequest(fileHandle.url, [firstChunkRange[0], undefined]),
      );
    },
  );

  const bytesRead1 = await new Promise<number | undefined>((resolve) => {
    readSync(fileName, fd, Buffer.alloc(length), length, position, resolve);
  });

  expect(bytesRead1).toBe(length);

  const bytesRead2 = await new Promise<number | undefined>((resolve) => {
    readSync(
      fileName,
      fd,
      Buffer.alloc(length),
      length,
      position + length,
      resolve,
    );
  });

  expect(bytesRead2).toBe(length);

  const firstCachedChunk = chunkCache.get(
    createChunkCacheKey(fileName, firstChunkRange[0], firstChunkRange[1]),
  );

  const secondChunkRange = [
    105_119_744,
    105_119_744 + config.chunkSize - 1,
  ] as const;

  const secondCachedChunk = chunkCache.get(
    createChunkCacheKey(fileName, secondChunkRange[0], secondChunkRange[1]),
  );

  expect.assert(firstCachedChunk);
  expect.assert(secondCachedChunk);

  expect(firstCachedChunk.equals(firstChunkResponseBuffer)).toBe(true);
  expect(secondCachedChunk.equals(secondChunkResponseBuffer)).toBe(true);

  expect(firstCachedChunk.equals(secondCachedChunk)).toBe(false);
});

it("serves reads from the chunk cache without requesting the stream", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  const { headerChunk } = fileChunkCalculations;
  const cachedHeader = randomBytes(headerChunk.size);

  chunkCache.set(headerChunk.cacheKey, cachedHeader);

  const length = 64;
  const offset = 128;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 0, buffer, length, offset, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer.equals(cachedHeader.subarray(offset, offset + length))).toBe(
    true,
  );

  mockAgent.assertNoPendingInterceptors();
  expect(fdToPreviousReadPositionMap.get(0)).toBe(offset);
});

it("serves subtitle reads from the in-memory subtitle content", async () => {
  const { readSync } = await import("./read.ts");
  const content = Buffer.from("1\n00:00:01,000 --> 00:00:02,000\nHello\n");

  fdToFileHandleMeta.set(1, {
    type: "subtitle",
    fileSize: content.length,
    filePath: "/movies/movie.en.srt",
    fileBaseName: "movie.en.srt",
    contentBuffer: content,
  });

  const buffer = Buffer.alloc(8);
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync("/movies/movie.en.srt", 1, buffer, 8, 2, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(8);
  });

  expect(buffer.equals(content.subarray(2, 10))).toBe(true);
});

it("returns only the remaining subtitle bytes for a read past the end of the content", async () => {
  const { readSync } = await import("./read.ts");
  const content = Buffer.from("subtitle");

  fdToFileHandleMeta.set(1, {
    type: "subtitle",
    fileSize: content.length,
    filePath: "/movies/movie.en.srt",
    fileBaseName: "movie.en.srt",
    contentBuffer: content,
  });

  const buffer = Buffer.alloc(16);
  const partialCallback = vi.fn<Parameters<typeof readSync>[5]>();
  const eofCallback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync("/movies/movie.en.srt", 1, buffer, 16, 5, partialCallback);
  readSync("/movies/movie.en.srt", 1, Buffer.alloc(16), 16, 8, eofCallback);

  await vi.waitFor(() => {
    expect(partialCallback).toHaveBeenCalledWith(3);
    expect(eofCallback).toHaveBeenCalledWith(0);
  });

  expect(buffer.subarray(0, 3).toString()).toBe("tle");
});

it("fails with EBADF when reading an unknown file descriptor", async () => {
  const { readSync } = await import("./read.ts");
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 99, Buffer.alloc(64), 64, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EBADF);
  });
});

it("fails with EBADF when the file has no chunk calculations", async () => {
  const { readSync } = await import("./read.ts");
  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  fileNameToFileChunkCalculationsMap.clear();

  readSync(fileName, 0, Buffer.alloc(64), 64, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EBADF);
  });
});

it("returns no bytes when the stream request is aborted", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName);

  expect.assert(fileChunkCalculations);

  mockAgent
    .get("http://example.com")
    .intercept({ path: `/files/${fileName}` })
    .replyWithError(new Undici.errors.RequestAbortedError());

  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 0, Buffer.alloc(64), 64, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(0);
  });
});

it("fails with EIO when reading from beyond the end of the file", async () => {
  const { readSync } = await import("./read.ts");
  const fileHandle = fdToFileHandleMeta.get(0);

  expect.assert(fileHandle);

  const callback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, 0, Buffer.alloc(64), 64, fileHandle.fileSize, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(Fuse.EIO);
  });
});

it("restarts the stream from the requested chunk when a body read does not continue from the current stream position", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");
  const fd = 0;
  const length = 131_072;
  const position = 104_988_672;
  const chunkAlignedStart = 104_071_168;
  const streamData = randomBytes(config.chunkSize * 2);
  const requestedRanges: string[] = [];

  fdToPreviousReadPositionMap.set(fd, config.chunkSize * 100);
  fdToCurrentStreamPositionMap.set(fd, config.chunkSize * 50);

  mockAgent
    .get("http://example.com")
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      requestedRanges.push((headers as Record<string, string>)["range"] ?? "");

      return { statusCode: 206, data: streamData };
    });

  const seekCallback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, fd, Buffer.alloc(length), length, position, seekCallback);

  // The seek fails the read so the mount retries it against the restarted stream
  await vi.waitFor(() => {
    expect(seekCallback).toHaveBeenCalledWith(Fuse.EIO);
  });

  expect(requestedRanges).toStrictEqual([
    `bytes=${chunkAlignedStart.toString()}-`,
  ]);
  expect(fdToCurrentStreamPositionMap.get(fd)).toBe(chunkAlignedStart);

  const buffer = Buffer.alloc(length);
  const retryCallback = vi.fn<Parameters<typeof readSync>[5]>();

  readSync(fileName, fd, buffer, length, position, retryCallback);

  await vi.waitFor(() => {
    expect(retryCallback).toHaveBeenCalledWith(length);
  });

  const offset = position - chunkAlignedStart;

  expect(buffer.equals(streamData.subarray(offset, offset + length))).toBe(
    true,
  );
  expect(requestedRanges).toHaveLength(1);
});

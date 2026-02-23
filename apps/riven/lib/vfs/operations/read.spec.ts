import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../__tests__/test-context.ts";
import { config } from "../config.ts";
import { chunkCache } from "../utilities/chunk-cache.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import { createChunkCacheKey } from "../utilities/chunks/create-chunk-cache-key.ts";
import {
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { createStreamRequest } from "../utilities/requests/create-stream-request.ts";

import type { MockAgent } from "undici";

const fileName = "movie.mkv";

function setupRangeInterceptor(
  agent: MockAgent,
  range: readonly [number, number | undefined],
) {
  const mockPool = agent.get("http://example.com");

  const size = range[1] !== undefined ? range[1] - range[0] + 1 : undefined;
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
  fileNameToFileChunkCalculationsMap.clear();
  fdToPreviousReadPositionMap.clear();

  const fileSize = 1024 * 1024 * 1024 * 10; // 10 GB

  fdToFileHandleMeta.set(0, {
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
  const callback = vi.fn();

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
  const callback = vi.fn();

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
  const callback = vi.fn();

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
  const callback = vi.fn();

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

  const cachedChunk = Buffer.alloc(config.headerSize).fill(
    randomBytes(config.headerSize),
  );

  chunkCache.set(
    createChunkCacheKey(fileName, 0, config.headerSize - 1),
    cachedChunk,
  );

  const responseBuffer = setupRangeInterceptor(mockAgent, [262144, undefined]);

  const length = 131072; // 128 KB

  const position = 196608;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn();

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

  const length = 32768; // 32 KB
  const position = config.chunkSize * 100; // 100MB

  const responseBuffer = setupRangeInterceptor(mockAgent, [
    position,
    position + length - 1,
  ]);

  const buffer = Buffer.alloc(length);
  const callback = vi.fn();

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

  fdToPreviousReadPositionMap.set(0, config.chunkSize * 100); // 10MB

  const length = 131072;
  const position = 104988672;

  const firstChunkResponseBuffer = Buffer.alloc(config.chunkSize).fill(
    randomBytes(config.chunkSize),
  );

  const secondChunkResponseBuffer = Buffer.alloc(config.chunkSize).fill(
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
    104071168,
    104071168 + config.chunkSize - 1,
  ] as const;

  const fileHandle = fdToFileHandleMeta.get(0);

  expect.assert(fileHandle);

  fdToResponsePromiseMap.set(
    0,
    createStreamRequest(0, fileHandle.url, [firstChunkRange[0], undefined]),
  );

  const callback = vi.fn();

  readSync(fileName, 0, Buffer.alloc(length), length, position, callback);
  readSync(
    fileName,
    0,
    Buffer.alloc(length),
    length,
    position + length,
    callback,
  );

  await vi.waitFor(() => {
    expect(callback).nthCalledWith(1, length);
    expect(callback).nthCalledWith(2, length);
  });

  const firstCachedChunk = chunkCache.get(
    createChunkCacheKey(fileName, firstChunkRange[0], firstChunkRange[1]),
  );

  const secondChunkRange = [
    105119744,
    105119744 + config.chunkSize - 1,
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

import { it } from "@repo/core-util-vitest-test-context";

import { randomBytes } from "node:crypto";
import { expect, vi } from "vitest";

import { config } from "../config.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import { createChunkCacheKey } from "../utilities/chunks/create-chunk-cache-key.ts";
import {
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponseMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

import type { MockAgent } from "undici";

vi.mock("shm-typed-array");

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
  fdToResponseMap.clear();
  fileNameToFileChunkCalculationsMap.clear();
  fdToPreviousReadPositionMap.clear();

  const fileSize = 1024 * 1024 * 1024 * 10; // 10 GB

  fdToFileHandleMeta.set(0, {
    fileId: 1,
    fileSize: fileSize.toString(),
    filePath: `/files/${fileName}`,
    fileName,
    url: `http://example.com/files/${fileName}`,
  });

  fileNameToFileChunkCalculationsMap.set(
    fileName,
    calculateFileChunks(1, fileSize),
  );

  vi.resetAllMocks();
});

it("fetches the header chunk if the requested range is entirely within the header chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const shm = vi.mocked(await import("shm-typed-array"));

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

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

  expect(buffer).toStrictEqual(responseBuffer.subarray(0, length));
  expect(shm.create).toHaveBeenCalledWith(
    fileChunkCalculations.headerChunk.size,
    "Buffer",
    fileChunkCalculations.headerChunk.cacheKey,
  );
});

it("fetches the footer chunk if the requested range is entirely within the footer chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const shm = vi.mocked(await import("shm-typed-array"));

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

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

  expect(buffer).toStrictEqual(responseBuffer.subarray(0, length));
  expect(shm.create).toHaveBeenCalledWith(
    fileChunkCalculations.footerChunk.size,
    "Buffer",
    fileChunkCalculations.footerChunk.cacheKey,
  );
});

it("correctly calculates offsets when copying chunk data into the buffer", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

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

  expect(buffer).toStrictEqual(
    responseBuffer.subarray(offset, offset + length),
  );
});

it("offsets the first chunk by the size of the header chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

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

  expect(buffer).toStrictEqual(responseBuffer.subarray(0, length));
});

it("reads data across multiple chunks, utilising the shared memory cache where possible", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");
  const shm = vi.mocked(await import("shm-typed-array"));

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

  const cachedChunk = Buffer.alloc(fileChunkCalculations.headerChunk.size).fill(
    randomBytes(fileChunkCalculations.headerChunk.size),
  );

  shm.get.mockImplementation((key) => {
    if (key === fileChunkCalculations.headerChunk.cacheKey) {
      return cachedChunk;
    }

    return null;
  });

  const responseBuffer = setupRangeInterceptor(mockAgent, [262144, undefined]);

  const length = 131072; // 128 KB

  const position = 196608;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn();

  readSync(fileName, 0, buffer, length, position, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer).toStrictEqual(
    Buffer.concat([cachedChunk, responseBuffer]).subarray(
      position,
      position + length,
    ),
  );

  expect(shm.create).toHaveBeenCalledWith(
    config.chunkSize,
    "Buffer",
    createChunkCacheKey(1, 262144, 262144 + config.chunkSize - 1),
  );
});

it("performs a one-off scan when receiving a read outside the scan tolerance limit during playback", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");
  const shm = vi.mocked(await import("shm-typed-array"));

  fdToPreviousReadPositionMap.set(0, 10485760); // 10MB

  const length = 32768; // 32 KB
  const position = 104857600; // 100MB

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

  expect(buffer).toStrictEqual(responseBuffer);

  expect(shm.create).not.toHaveBeenCalled();
});

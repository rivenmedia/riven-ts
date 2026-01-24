import { it } from "@repo/core-util-vitest-test-context";

import { randomBytes } from "node:crypto";
import { expect, vi } from "vitest";

import { config } from "../config.ts";
import { calculateFileChunks } from "../utilities/chunks/calculate-file-chunks.ts";
import {
  fdToFileHandleMeta,
  fdToResponseMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

vi.mock("shm-typed-array");

const fileName = "movie.mkv";

it.beforeEach(() => {
  fdToFileHandleMeta.clear();
  fdToResponseMap.clear();
  fileNameToFileChunkCalculationsMap.clear();

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
});

it("fetches the header chunk if the requested range is entirely within the header chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

  const responseBuffer = Buffer.alloc(fileChunkCalculations.headerChunk.size);

  responseBuffer.set(randomBytes(fileChunkCalculations.headerChunk.size));

  const mockPool = mockAgent.get("http://example.com");

  mockPool
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (
        rangeHeader ===
        `bytes=${fileChunkCalculations.headerChunk.range.join("-")}`
      ) {
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

  const length = 64;
  const buffer = Buffer.alloc(length);
  const callback = vi.fn();

  readSync(fileName, 0, buffer, length, 0, callback);

  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalledWith(length);
  });

  expect(buffer).toStrictEqual(responseBuffer.subarray(0, length));
});

it("fetches the footer chunk if the requested range is entirely within the footer chunk", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

  const responseBuffer = Buffer.alloc(fileChunkCalculations.footerChunk.size);

  responseBuffer.set(randomBytes(fileChunkCalculations.footerChunk.size));

  const mockPool = mockAgent.get("http://example.com");

  const length = 64;

  mockPool
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (
        rangeHeader ===
        `bytes=${fileChunkCalculations.footerChunk.range.join("-")}`
      ) {
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
    .persist();

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
});

it("correctly calculates offsets when copying chunk data into the buffer", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

  const responseBuffer = Buffer.alloc(fileChunkCalculations.footerChunk.size);

  responseBuffer.set(randomBytes(fileChunkCalculations.footerChunk.size));

  const mockPool = mockAgent.get("http://example.com");

  const length = 64;
  const offset = 1024;

  mockPool
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (
        rangeHeader ===
        `bytes=${fileChunkCalculations.footerChunk.range.join("-")}`
      ) {
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

  mockPool.cleanMocks();
  await mockPool.close();
});

it("offsets the first chunk by the size of the header chunks", async ({
  mockAgent,
}) => {
  const { readSync } = await import("./read.ts");

  const fileChunkCalculations =
    fileNameToFileChunkCalculationsMap.get(fileName)!;

  const responseBuffer = Buffer.alloc(config.chunkSize);

  responseBuffer.set(randomBytes(config.chunkSize));

  const mockPool = mockAgent.get("http://example.com");

  const length = 64;

  mockPool
    .intercept({ path: `/files/${fileName}` })
    .reply(({ headers }) => {
      const rangeHeader = (headers as Record<string, string>)["range"];

      if (
        rangeHeader ===
        `bytes=${fileChunkCalculations.headerChunk.size.toString()}-`
      ) {
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

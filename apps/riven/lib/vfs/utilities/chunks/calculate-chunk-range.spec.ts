import { expect, it } from "vitest";

import { config } from "#vfs/config.ts";
import { fileNameToFileChunkCalculationsMap } from "#vfs/utilities/file-handle-map.ts";

import { calculateChunkRange } from "./calculate-chunk-range.ts";
import { calculateFileChunks } from "./calculate-file-chunks.ts";

const fileName = "movie.mkv";
const fileSize = 100 * 1024 * 1024; // 100 MB, with a 2 MB footer starting at 102,760,448

it.beforeEach(() => {
  fileNameToFileChunkCalculationsMap.clear();
  fileNameToFileChunkCalculationsMap.set(
    fileName,
    calculateFileChunks(fileName, fileSize),
  );
});

it("includes the footer chunk when a body read spans into the footer", () => {
  const footerStart = 102_760_448;

  const { chunks, firstChunk, lastChunk, size } = calculateChunkRange({
    chunkSize: config.chunkSize,
    fileSize,
    fileName,
    requestRange: [footerStart - 100, footerStart + 99],
  });

  expect(chunks.map(({ range }) => range)).toStrictEqual([
    [101_974_016, footerStart - 1],
    [footerStart, fileSize - 1],
  ]);
  expect(firstChunk.range).toStrictEqual([101_974_016, footerStart - 1]);
  expect(lastChunk?.range).toStrictEqual([footerStart, fileSize - 1]);
  expect(size).toBe(200);
});

it.for([
  {
    label: "starting at the end of the file",
    start: fileSize,
    end: fileSize + 10,
  },
  {
    label: "starting past the end of the file",
    start: fileSize + 1,
    end: fileSize + 10,
  },
  { label: "ending before it starts", start: 1000, end: 999 },
])("rejects a request range $label", ({ start, end }) => {
  expect(() =>
    calculateChunkRange({
      chunkSize: config.chunkSize,
      fileSize,
      fileName,
      requestRange: [start, end],
    }),
  ).toThrow("Invalid request range");
});

it("accepts a request range that ends past the end of the file", () => {
  const { chunks } = calculateChunkRange({
    chunkSize: config.chunkSize,
    fileSize,
    fileName,
    requestRange: [fileSize - 10, fileSize + 10],
  });

  expect(chunks.map(({ range }) => range)).toStrictEqual([
    [102_760_448, fileSize - 1],
  ]);
});

it("requires the file's chunk calculations", () => {
  expect(() =>
    calculateChunkRange({
      chunkSize: config.chunkSize,
      fileSize,
      fileName: "unknown.mkv",
      requestRange: [0, 10],
    }),
  ).toThrow("Missing pre-calculated chunk data for file: unknown.mkv");
});

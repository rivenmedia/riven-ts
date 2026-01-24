import z from "zod";

import { createChunkRangeLabel } from "../utilities/chunks/create-chunk-range-label.ts";
import { fileNameToFileChunkCalculationsMap } from "../utilities/file-handle-map.ts";
import { ChunkMetadata } from "./chunk.schema.ts";
import { FileChunkCalculations } from "./file-chunk-calculations.schema.js";

const isValidRange = ({ end, fileSize, start }: RequestRange) => {
  if (start >= fileSize) {
    return false;
  }

  const effectiveEnd = Math.min(end, fileSize - 1);

  return effectiveEnd >= start;
};

const calculateRequiredChunks = (
  start: number,
  end: number,
  chunkSize: number,
  fileSize: number,
  fileId: number,
  { headerChunk, footerChunk }: FileChunkCalculations,
) => {
  if (end < headerChunk.range[1]) {
    return [headerChunk] as const;
  }

  if (start >= footerChunk.range[0]) {
    return [footerChunk] as const;
  }

  const chunksRequired = Math.ceil((end + 1 - start) / chunkSize);

  return Array.from<ChunkMetadata>({ length: chunksRequired }).map((_, i) => {
    const chunkStartPos = start + i * chunkSize;
    const chunkEndPos = Math.min(chunkStartPos + chunkSize - 1, fileSize - 1);

    return ChunkMetadata.parse({
      fileId,
      start: chunkStartPos,
      end: chunkEndPos,
    });
  }) as [ChunkMetadata, ...ChunkMetadata[]];
};

export const transformRequestRangeToBounds = z.transform(
  ({ start, end, fileSize, chunkSize, fileId, fileName }: RequestRange) => {
    const preCalculatedChunks =
      fileNameToFileChunkCalculationsMap.get(fileName);

    if (!preCalculatedChunks) {
      throw new Error(
        `Missing pre-calculated chunk data for file: ${fileName}`,
      );
    }

    const effectiveEnd = Math.min(end, fileSize - 1);

    const chunkAlignedStart = Math.floor(start / chunkSize) * chunkSize;
    const chunkAlignedEnd = Math.min(
      Math.ceil((effectiveEnd + 1) / chunkSize) * chunkSize - 1,
      fileSize - 1,
    );

    const chunks = calculateRequiredChunks(
      chunkAlignedStart,
      chunkAlignedEnd,
      chunkSize,
      fileSize,
      fileId,
      preCalculatedChunks,
    );

    return {
      chunkRange: [chunkAlignedStart, chunkAlignedEnd] as const,
      requestRange: [start, effectiveEnd] as const,
      bytesRequired: effectiveEnd - start + 1,
      size: chunkAlignedEnd - chunkAlignedStart + 1,
      chunksRequired: chunks.length,
      chunks,
      firstChunk: chunks[0],
      lastChunk: chunks.length > 1 ? chunks[chunks.length - 1] : undefined,
      rangeLabel: createChunkRangeLabel([start, effectiveEnd]),
    };
  },
);

export const RequestRange = z
  .object({
    fileName: z.string(),
    fileId: z.number().nonnegative(),
    start: z.int().nonnegative(),
    end: z.int().nonnegative(),
    fileSize: z.int().nonnegative(),
    chunkSize: z.int().positive(),
  })
  .refine(isValidRange, "Invalid request range");

export type RequestRange = z.infer<typeof RequestRange>;

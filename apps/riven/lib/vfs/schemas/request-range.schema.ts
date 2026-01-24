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
    const chunkStartPos = Math.max(headerChunk.size, start + i * chunkSize);
    const chunkEndPos = Math.min(
      chunkStartPos + chunkSize - 1,
      footerChunk.range[0] - 1,
    );

    return ChunkMetadata.parse({
      fileId,
      start: chunkStartPos,
      end: chunkEndPos,
    });
  }) as [ChunkMetadata, ...ChunkMetadata[]];
};

export const transformRequestRangeToBounds = z.transform(
  ({ start, end, chunkSize, fileId, fileName }: RequestRange) => {
    const preCalculatedChunks =
      fileNameToFileChunkCalculationsMap.get(fileName);

    if (!preCalculatedChunks) {
      throw new Error(
        `Missing pre-calculated chunk data for file: ${fileName}`,
      );
    }

    const chunks = calculateRequiredChunks(
      start,
      end,
      chunkSize,
      fileId,
      preCalculatedChunks,
    );

    const [firstChunk] = chunks;
    const lastChunk = chunks.length > 1 ? chunks[chunks.length - 1] : undefined;

    return {
      requestRange: [start, end] as const,
      bytesRequired: end - start + 1,
      size: end - start + 1,
      chunksRequired: chunks.length,
      chunks,
      firstChunk,
      lastChunk,
      rangeLabel: createChunkRangeLabel([
        firstChunk.range[0],
        lastChunk?.range[1] ?? firstChunk.range[1],
      ]),
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

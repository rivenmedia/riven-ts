import z from "zod";

import { Chunk } from "./chunk.schema.js";

const isValidRange = ({ end, fileSize, start }: RequestRange) => {
  if (start >= fileSize) {
    return false;
  }

  const effectiveEnd = Math.min(end, fileSize - 1);

  return effectiveEnd >= start;
};

export const transformRequestRangeToBounds = z.transform(
  ({ start, end, fileSize, chunkSize, fileId }: RequestRange) => {
    const effectiveEnd = Math.min(end, fileSize - 1);

    const chunkAlignedStart = Math.floor(start / chunkSize) * chunkSize;
    const chunkAlignedEnd = Math.min(
      Math.ceil((effectiveEnd + 1) / chunkSize) * chunkSize - 1,
      fileSize - 1,
    );

    const chunksRequired = Math.ceil(
      (chunkAlignedEnd + 1 - chunkAlignedStart) / chunkSize,
    );
    const chunks: [Chunk, ...Chunk[]] = [];

    for (let i = 0; i < chunksRequired; i++) {
      const chunkStartPos = chunkAlignedStart + i * chunkSize;
      const chunkEndPos = Math.min(chunkStartPos + chunkSize - 1, fileSize - 1);

      chunks.push(
        Chunk.parse({
          fileId,
          start: chunkStartPos,
          end: chunkEndPos,
        }),
      );
    }

    return {
      chunkRange: [chunkAlignedStart, chunkAlignedEnd] as const,
      requestRange: [start, effectiveEnd] as const,
      bytesRequired: effectiveEnd - start + 1,
      size: chunkAlignedEnd - chunkAlignedStart + 1,
      chunksRequired,
      chunks,
      firstChunk: chunks[0],
      lastChunk: chunks[chunks.length - 1] ?? chunks[0],
    };
  },
);

export const RequestRange = z
  .object({
    fileId: z.number().nonnegative(),
    start: z.int().nonnegative(),
    end: z.int().nonnegative(),
    fileSize: z.int().nonnegative(),
    chunkSize: z.int().positive(),
  })
  .refine(isValidRange, "Invalid request range");

export type RequestRange = z.infer<typeof RequestRange>;

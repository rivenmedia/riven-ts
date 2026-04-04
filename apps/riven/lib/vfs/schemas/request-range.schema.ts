import { type } from "arktype";

import { createChunkRangeLabel } from "../utilities/chunks/create-chunk-range-label.ts";
import { fileNameToFileChunkCalculationsMap } from "../utilities/file-handle-map.ts";
import { ChunkMetadata } from "./chunk.schema.ts";
import { FileChunkCalculations } from "./file-chunk-calculations.schema.ts";

const calculateRequiredChunks = (
  start: number,
  end: number,
  chunkSize: number,
  fileName: string,
  { headerChunk, footerChunk, totalChunks }: FileChunkCalculations,
) => {
  if (end <= headerChunk.range[1]) {
    return [headerChunk] as const;
  }

  if (start >= footerChunk.range[0]) {
    return [footerChunk] as const;
  }

  const chunkAlignedStart = Math.max(0, start - headerChunk.size);
  const chunkAlignedEnd = Math.min(
    Math.max(0, end - headerChunk.size),
    footerChunk.range[0] - 1,
  );

  const lowerChunkIndex = Math.min(
    Math.floor(chunkAlignedStart / chunkSize),
    totalChunks + 1,
  );

  const upperChunkIndex = Math.min(
    Math.floor(chunkAlignedEnd / chunkSize),
    totalChunks + 1,
  );

  const chunks: ChunkMetadata[] = [];

  // If the current request is within the header boundaries, include the header chunk.
  // This is sized differently to normal chunks, so handle it separately.
  if (start < headerChunk.size) {
    chunks.push(headerChunk);
  }

  for (let i = lowerChunkIndex; i <= upperChunkIndex; i++) {
    const chunkStart = headerChunk.size + i * chunkSize;
    const chunkEnd = Math.min(
      chunkStart + chunkSize - 1,
      footerChunk.range[0] - 1,
    );

    chunks.push(
      ChunkMetadata.assert({
        index: i + 1,
        fileName,
        start: chunkStart,
        end: chunkEnd,
      }),
    );
  }

  // If the request spans into the footer, include the footer chunk.
  if (end >= footerChunk.range[0]) {
    chunks.push(footerChunk);
  }

  return chunks;
};

export const transformRequestRangeToBounds = z.transform(
  ({ start, end, chunkSize, fileName }: RequestRange) => {
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
      fileName,
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

export const RequestRange = type({
  fileName: "string > 0",
  start: "number.integer >= 0",
  end: "number.integer >= 0",
  fileSize: "number.integer >= 0",
  chunkSize: "number.integer > 0",
}).narrow(({ end, fileSize, start }, ctx) => {
  if (start >= fileSize) {
    return ctx.reject(
      `Start byte ${start.toString()} exceeds file size ${fileSize.toString()}`,
    );
  }

  const effectiveEnd = Math.min(end, fileSize - 1);
  const isValidRange = effectiveEnd >= start;

  if (!isValidRange) {
    return ctx.reject(
      `End byte ${end.toString()} is before start byte ${start.toString()}`,
    );
  }

  return true;
});

export type RequestRange = typeof RequestRange.infer;

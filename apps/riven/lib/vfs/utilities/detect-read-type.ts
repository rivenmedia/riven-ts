import { config } from "../config.ts";
import { chunkCache } from "./chunk-cache.ts";

import type { ChunkMetadata } from "../schemas/chunk.schema.ts";
import type { FileChunkCalculations } from "../schemas/file-chunk-calculations.schema.ts";
import type { FileHandleMetadata } from "./file-handle-map.ts";

export type ReadType =
  | "header-scan"
  | "footer-scan"
  | "footer-read"
  | "general-scan"
  | "body-read"
  | "cache-hit";

export const detectReadType = (
  { fileSize }: FileHandleMetadata,
  previousReadPosition: number | undefined,
  chunks: readonly ChunkMetadata[],
  size: number,
  fileChunkCalculations: FileChunkCalculations,
): ReadType => {
  const isRequestFullyCached = chunks.every((chunk) =>
    chunkCache.has(chunk.cacheKey),
  );

  if (isRequestFullyCached) {
    return "cache-hit";
  }

  const start = chunks[0]?.range[0];
  const end = chunks[chunks.length - 1]?.range[1];

  if (start === undefined || end === undefined) {
    throw new Error("No start / end provided!");
  }

  if (start < end && end <= fileChunkCalculations.headerChunk.size) {
    return "header-scan";
  }

  if (
    (previousReadPosition ?? 0) <
      start - config.sequentialReadToleranceBlocks &&
    fileSize - fileChunkCalculations.footerChunk.size <= start &&
    start <= fileSize
  ) {
    return "footer-scan";
  }

  if (
    (previousReadPosition !== undefined &&
      Math.abs(previousReadPosition - start) > config.scanToleranceBytes &&
      start !== fileChunkCalculations.headerChunk.size &&
      size < config.blockSize) ||
    (start > fileChunkCalculations.headerChunk.size &&
      previousReadPosition === undefined)
  ) {
    return "general-scan";
  }

  if (start < fileSize - fileChunkCalculations.footerChunk.size) {
    return "body-read";
  }

  return "footer-read";
};

import { config } from "../../config.ts";
import { chunkCache } from "../chunk-cache.ts";
import { createChunkCacheKey } from "./create-chunk-cache-key.ts";
import { createChunkRangeLabel } from "./create-chunk-range-label.ts";

import type { FileChunkCalculations } from "../../schemas/file-chunk-calculations.schema.ts";

function calculateFooterSize(fileSize: number) {
  const percentageSize = fileSize * config.targetFooterPercentage;
  const rawFooterSize = Math.min(
    Math.max(percentageSize, config.minFooterSize),
    config.maxFooterSize,
  );

  const alignedFooterSize =
    Math.floor(rawFooterSize / config.blockSize) * config.blockSize;

  return Math.abs(alignedFooterSize);
}

export const calculateFileChunks = (fileName: string, fileSize: number) => {
  const footerSize = calculateFooterSize(fileSize);
  const footerStart = Math.max(0, fileSize - footerSize);
  const totalChunksExcludingHeaderAndFooter = Math.max(
    0,
    Math.floor((fileSize - footerSize - config.headerSize) / config.chunkSize),
  );

  const footerChunkRange = [
    Math.min(footerStart, Math.max(0, fileSize - 1)),
    Math.max(0, fileSize - 1),
  ] as const;

  const headerChunkRange = [
    0,
    Math.max(0, Math.min(config.headerSize, fileSize) - 1),
  ] as const;

  return {
    headerChunk: {
      index: 0,
      cacheKey: createChunkCacheKey(
        fileName,
        headerChunkRange[0],
        headerChunkRange[1],
      ),
      get isCached() {
        return chunkCache.has(this.cacheKey);
      },
      rangeLabel: createChunkRangeLabel(headerChunkRange),
      range: headerChunkRange,
      size: Math.min(config.headerSize, fileSize),
    },
    footerChunk: {
      index: totalChunksExcludingHeaderAndFooter + 1,
      cacheKey: createChunkCacheKey(
        fileName,
        footerChunkRange[0],
        footerChunkRange[1],
      ),
      get isCached() {
        return chunkCache.has(this.cacheKey);
      },
      rangeLabel: createChunkRangeLabel(footerChunkRange),
      range: footerChunkRange,
      size: footerSize,
    },
    totalChunks: totalChunksExcludingHeaderAndFooter,
  } satisfies FileChunkCalculations;
};

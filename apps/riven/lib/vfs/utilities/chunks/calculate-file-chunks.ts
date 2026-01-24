import { config } from "../../config.ts";
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

export const calculateFileChunks = (fileId: number, fileSize: number) => {
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
      cacheKey: createChunkCacheKey(
        fileId,
        headerChunkRange[0],
        headerChunkRange[1],
      ),
      rangeLabel: createChunkRangeLabel(headerChunkRange),
      range: headerChunkRange,
      size: Math.min(config.headerSize, fileSize),
    },
    footerChunk: {
      cacheKey: createChunkCacheKey(
        fileId,
        footerChunkRange[0],
        footerChunkRange[1],
      ),
      rangeLabel: createChunkRangeLabel(footerChunkRange),
      range: footerChunkRange,
      size: footerSize,
    },
    totalChunks: totalChunksExcludingHeaderAndFooter,
  } satisfies FileChunkCalculations;
};

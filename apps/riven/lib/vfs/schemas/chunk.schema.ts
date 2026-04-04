import { type } from "arktype";

import { chunkCache } from "../utilities/chunk-cache.ts";
import { createChunkCacheKey } from "../utilities/chunks/create-chunk-cache-key.ts";
import { createChunkRangeLabel } from "../utilities/chunks/create-chunk-range-label.ts";

export const ChunkMetadata = type({
  fileName: "string > 0",
  index: "number.integer >= 0",
  start: "number.integer >= 0",
  end: "number.integer >= 0",
}).pipe(({ fileName, start, end, index }) => {
  const cacheKey = createChunkCacheKey(fileName, start, end);

  return {
    index,
    get isCached() {
      return chunkCache.has(cacheKey);
    },
    cacheKey,
    rangeLabel: createChunkRangeLabel([start, end]),
    range: [start, end] as const,
    size: end - start + 1,
  };
});

export type ChunkMetadata = typeof ChunkMetadata.infer;

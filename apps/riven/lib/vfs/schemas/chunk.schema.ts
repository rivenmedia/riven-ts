import z from "zod";

import { chunkCache } from "../utilities/chunk-cache.ts";
import { createChunkCacheKey } from "../utilities/chunks/create-chunk-cache-key.ts";
import { createChunkRangeLabel } from "../utilities/chunks/create-chunk-range-label.ts";

export const ChunkMetadata = z
  .object({
    fileName: z.string().nonempty(),
    index: z.number().nonnegative(),
    start: z.number().nonnegative(),
    end: z.number().nonnegative(),
  })
  .transform(({ fileName, start, end, index }) => {
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

export type ChunkMetadata = z.infer<typeof ChunkMetadata>;

import z from "zod";

import { createChunkCacheKey } from "../utilities/chunks/create-chunk-cache-key.ts";
import { createChunkRangeLabel } from "../utilities/chunks/create-chunk-range-label.ts";

export const ChunkMetadata = z
  .object({
    fileId: z.number().nonnegative(),
    start: z.number().nonnegative(),
    end: z.number().nonnegative(),
  })
  .transform(({ fileId, start, end }) => ({
    cacheKey: createChunkCacheKey(fileId, start, end),
    rangeLabel: createChunkRangeLabel([start, end]),
    range: [start, end] as const,
    size: end - start + 1,
  }));

export type ChunkMetadata = z.infer<typeof ChunkMetadata>;

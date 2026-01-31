import Fuse from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";

import { FuseError } from "../../errors/fuse-error.ts";
import { chunkCache } from "../chunk-cache.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";

/**
 * When a read request can be fully satisfied from the chunk cache,
 * this function retrieves the cached chunks and concatenates them
 * into a single Buffer to return.
 *
 * @param fd The file descriptor for the current read request
 * @param chunks The chunks to load from the cache
 * @returns The cached chunk data
 */
export function performCacheHit(fd: number, chunks: readonly ChunkMetadata[]) {
  const cachedChunks: Buffer[] = [];

  for (const chunk of chunks) {
    const maybeCachedChunk = chunkCache.get(chunk.cacheKey);

    if (!maybeCachedChunk) {
      throw new FuseError(
        Fuse.EIO,
        `Expected chunk to be cached for cache-hit read type for fd ${fd.toString()}`,
      );
    }

    cachedChunks.push(maybeCachedChunk);
  }

  return Buffer.concat(cachedChunks);
}

import Fuse from "@zkochan/fuse-native";
import { setTimeout as sleep } from "node:timers/promises";

import { config } from "../../config.ts";
import { FuseError } from "../../errors/fuse-error.ts";
import { chunkCache } from "../chunk-cache.ts";
import { fdToCurrentStreamPositionMap } from "../file-handle-map.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";
import type BodyReadable from "undici/types/readable.js";

interface WaitForChunkResponse {
  chunk: Buffer;
  fetchedFromCache: boolean;
}

export const waitForChunk = async (
  fd: number,
  reader: BodyReadable.default,
  targetChunk: ChunkMetadata,
): Promise<WaitForChunkResponse> => {
  let chunk: Buffer | null = null;
  let fetchedFromCache = false;

  const timeout = setTimeout(() => {
    throw new FuseError(Fuse.ETIMEDOUT, `Timeout waiting for chunk`);
  }, config.chunkTimeoutSeconds * 1000);

  while ((chunk = reader.read(targetChunk.size) as Buffer | null) === null) {
    await sleep(50);

    // Check if the chunk got cached by another read whilst waiting
    // to prevent fetching the next chunk and returning it as the previous one
    const maybeCachedChunk = chunkCache.get(targetChunk.cacheKey);

    if (maybeCachedChunk) {
      chunk = maybeCachedChunk;
      fetchedFromCache = true;

      break;
    }
  }

  if (!fetchedFromCache) {
    fdToCurrentStreamPositionMap.set(
      fd,
      (fdToCurrentStreamPositionMap.get(fd) ?? 0) + chunk.byteLength,
    );
  }

  clearTimeout(timeout);

  return {
    chunk,
    fetchedFromCache,
  };
};

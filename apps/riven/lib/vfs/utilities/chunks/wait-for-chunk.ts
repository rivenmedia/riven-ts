import Fuse from "@zkochan/fuse-native";
import assert from "node:assert";
import { Buffer } from "node:buffer";
import { setTimeout as sleep } from "node:timers/promises";

import { config } from "../../config.ts";
import { FuseError } from "../../errors/fuse-error.ts";
import { SeekDetected } from "../../errors/seek-detected.ts";
import { chunkCache } from "../chunk-cache.ts";
import { fdToCurrentStreamPositionMap } from "../file-handle-map.ts";
import { getVfsOperationContext } from "../vfs-operation-context.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";
import type BodyReadable from "undici/types/readable.ts";

interface WaitForChunkResponse {
  chunk: Buffer;
  fetchedFromCache: boolean;
}

export const waitForChunk = async (
  reader: BodyReadable.default,
  targetChunk: ChunkMetadata,
): Promise<WaitForChunkResponse> => {
  const { fd, context } = getVfsOperationContext("read");

  let chunk: Buffer | null = null;
  let fetchedFromCache = false;

  const timeoutSignal = AbortSignal.timeout(config.chunkTimeoutSeconds * 1000);

  while ((chunk = reader.read(targetChunk.size) as Buffer | null) === null) {
    if (context.seekController.signal.aborted) {
      throw new SeekDetected(
        `Seek detected; aborting chunk request for chunk ${targetChunk.rangeLabel}`,
      );
    }

    if (reader.readableAborted) {
      throw new FuseError(
        Fuse.EIO,
        `Stream was aborted before chunk could be read ${targetChunk.rangeLabel}`,
      );
    }

    if (timeoutSignal.aborted) {
      throw new FuseError(
        Fuse.ETIMEDOUT,
        `Timed out waiting for chunk ${targetChunk.rangeLabel}`,
      );
    }

    // Wait a tick before trying to read again to prevent event loop blockages
    await sleep();

    // Check if the chunk got cached by another read whilst waiting
    // to prevent fetching the next chunk and returning it as the previous one
    const maybeCachedChunk = chunkCache.get(targetChunk.cacheKey);

    if (maybeCachedChunk) {
      chunk = maybeCachedChunk;
      fetchedFromCache = true;

      break;
    }
  }

  // Check for seek again after reading as the current stream position will be undefined
  if (context.seekController.signal.aborted) {
    throw new SeekDetected(
      `Seek detected; aborting chunk request for chunk ${targetChunk.rangeLabel}`,
    );
  }

  assert(
    context.currentStreamPosition !== undefined,
    "Current stream position should be defined when waiting for chunk",
  );

  if (!fetchedFromCache) {
    fdToCurrentStreamPositionMap.set(
      fd,
      context.currentStreamPosition + chunk.byteLength,
    );
  }

  return {
    chunk,
    fetchedFromCache,
  };
};

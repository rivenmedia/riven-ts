import { benchmark } from "@repo/util-plugin-sdk/helpers/benchmark";

import Fuse from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";

import { logger } from "../../../utilities/logger/logger.ts";
import { FuseError } from "../../errors/fuse-error.ts";
import { chunkCache } from "../chunk-cache.ts";
import { waitForChunk } from "../chunks/wait-for-chunk.ts";
import {
  type FileHandleMetadata,
  fdToCurrentStreamPositionMap,
  fdToResponsePromiseMap,
} from "../file-handle-map.ts";
import { createStreamRequest } from "../requests/create-stream-request.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";

/**
 * Performs a body read for the given file descriptor and chunks.
 * This is used when there are missing chunks that need to be fetched
 * from the stream, which are then stitched together with any cached chunks.
 *
 * @param fd The file descriptor for the current read request
 * @param chunks The chunks that form the request
 * @param fileHandle The file handle metadata for the file descriptor
 * @returns The requests chunk data
 */
export async function performBodyRead(
  fd: number,
  chunks: readonly ChunkMetadata[],
  fileHandle: FileHandleMetadata,
) {
  const cachedChunksMetadata = chunks.filter((chunk) => chunk.isCached);
  const missingChunksMetadata = chunks.filter((chunk) => !chunk.isCached);

  if (!missingChunksMetadata[0]) {
    throw new FuseError(
      Fuse.EIO,
      `No missing chunks calculated for fd ${fd.toString()}`,
    );
  }

  logger.silly(
    [
      `Cached chunks: ${cachedChunksMetadata.map((chunk) => chunk.rangeLabel).join(", ") || "none"}`,
      `Missing chunks: ${missingChunksMetadata.map((chunk) => chunk.rangeLabel).join(", ")}`,
    ].join(" | "),
  );

  const streamReader =
    (await fdToResponsePromiseMap.get(fd)) ??
    (await createStreamRequest(fd, fileHandle.url, [
      missingChunksMetadata[0].range[0],
      undefined,
    ]));

  if (!fdToCurrentStreamPositionMap.has(fd)) {
    fdToCurrentStreamPositionMap.set(fd, missingChunksMetadata[0].range[0]);
  }

  const currentStreamPosition = fdToCurrentStreamPositionMap.get(fd);

  if (currentStreamPosition === undefined) {
    throw new FuseError(
      Fuse.EIO,
      `Missing current stream position for fd ${fd.toString()}`,
    );
  }

  const {
    timeTaken,
    result: { bytesFetched, fetchedChunks },
  } = await benchmark(async () => {
    const fetchedChunks: Buffer[] = [];

    let bytesFetched = 0;

    for (const targetChunk of missingChunksMetadata) {
      const { chunk, fetchedFromCache } = await waitForChunk(
        fd,
        streamReader.body,
        targetChunk,
      );

      if (!fetchedFromCache) {
        logger.silly(
          `Fetched chunk ${targetChunk.rangeLabel} for fd ${fd.toString()}`,
        );

        bytesFetched += chunk.byteLength;
      }

      fetchedChunks.push(chunk);

      chunkCache.set(targetChunk.cacheKey, chunk);
    }

    return {
      bytesFetched,
      fetchedChunks,
    };
  });

  if (bytesFetched === 0) {
    logger.silly(
      `All chunks were fetched from cache for ${chunks.map((chunk) => chunk.rangeLabel).join(", ")} fd ${fd.toString()}`,
    );
  } else {
    logger.verbose(
      `Fetched ${bytesFetched.toString()} bytes for ${chunks.map((chunk) => chunk.rangeLabel).join(", ")} in ${timeTaken.toFixed(2)}ms from stream for fd ${fd.toString()}`,
    );
  }

  const cachedChunks: Buffer[] = [];

  for (const chunk of cachedChunksMetadata) {
    const maybeCachedChunk = chunkCache.get(chunk.cacheKey);

    if (!maybeCachedChunk) {
      throw new FuseError(
        Fuse.EIO,
        `Expected chunk to be cached after fetch for fd ${fd.toString()}`,
      );
    }

    cachedChunks.push(maybeCachedChunk);
  }

  return Buffer.concat([...cachedChunks, ...fetchedChunks]);
}

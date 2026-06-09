import { benchmark } from "@repo/util-plugin-sdk/helpers/benchmark";

import Fuse from "@zkochan/fuse-native";
import assert from "node:assert";
import { Buffer } from "node:buffer";

import { logger } from "../../../utilities/logger/logger.ts";
import { FuseError } from "../../errors/fuse-error.ts";
import { chunkCache } from "../chunk-cache.ts";
import { waitForChunk } from "../chunks/wait-for-chunk.ts";
import { createStreamRequest } from "../requests/create-stream-request.ts";
import { seek } from "../seek.ts";
import { getVfsOperationContext } from "../vfs-operation-context.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";

/**
 * Performs a body read for the given file descriptor and chunks.
 * This is used when there are missing chunks that need to be fetched
 * from the stream, which are then stitched together with any cached chunks.
 *
 * @param chunks The chunks that form the request
 * @returns The requests chunk data
 */
export async function performBodyRead(chunks: readonly ChunkMetadata[]) {
  const {
    fd,
    context: { fileHandleMetadata, currentStreamPosition, responsePromise },
  } = getVfsOperationContext("read");

  assert(
    fileHandleMetadata.type !== "subtitle",
    new FuseError(
      Fuse.EIO,
      "Body read should not be performed for subtitle files",
    ),
  );

  const cachedChunksMetadata = chunks.filter((chunk) => chunk.isCached);
  const missingChunksMetadata = chunks.filter((chunk) => !chunk.isCached);

  if (!missingChunksMetadata[0]) {
    throw new FuseError(Fuse.EIO, "No missing chunks calculated");
  }

  logger.silly(
    [
      `Cached chunks: ${cachedChunksMetadata.map((chunk) => chunk.rangeLabel).join(", ") || "none"}`,
      `Missing chunks: ${missingChunksMetadata.map((chunk) => chunk.rangeLabel).join(", ")}`,
    ].join(" | "),
  );

  const [chunkAlignedStart] = missingChunksMetadata[0].range;

  if (currentStreamPosition && currentStreamPosition !== chunkAlignedStart) {
    seek(currentStreamPosition, chunkAlignedStart);
  }

  const streamReader =
    (await responsePromise) ??
    (await createStreamRequest(fileHandleMetadata.url, [
      chunkAlignedStart,
      undefined,
    ]));

  const {
    timeTaken,
    result: { bytesFetched, fetchedChunks, fetchedChunksMetadata },
  } = await benchmark(async () => {
    const fetchedChunks: Buffer[] = [];
    const fetchedChunksMetadata: ChunkMetadata[] = [];

    let bytesFetched = 0;

    for (const targetChunk of missingChunksMetadata) {
      const { chunk, fetchedFromCache } = await waitForChunk(
        streamReader.body,
        targetChunk,
      );

      if (!fetchedFromCache) {
        logger.silly(`Fetched chunk ${targetChunk.rangeLabel}`);

        bytesFetched += chunk.byteLength;

        fetchedChunksMetadata.push(targetChunk);
      }

      fetchedChunks.push(chunk);

      chunkCache.set(targetChunk.cacheKey, chunk);
    }

    return {
      bytesFetched,
      fetchedChunks,
      fetchedChunksMetadata,
    };
  });

  if (fetchedChunksMetadata.length) {
    const chunkLabels = fetchedChunksMetadata
      .map((chunk) => chunk.rangeLabel)
      .join(", ");

    logger.verbose(
      `Fetched ${bytesFetched.toString()} bytes from stream for chunks ${chunkLabels} in ${timeTaken.toFixed(2)}ms.`,
    );
  } else {
    const chunkLabels = chunks.map((chunk) => chunk.rangeLabel).join(", ");

    logger.silly(
      `Response was read from cache for fd ${fd.toString()} | chunks: ${chunkLabels} in ${timeTaken.toFixed(2)}ms.`,
    );
  }

  const cachedChunks: Buffer[] = [];

  for (const chunk of cachedChunksMetadata) {
    const maybeCachedChunk = chunkCache.get(chunk.cacheKey);

    if (!maybeCachedChunk) {
      throw new FuseError(Fuse.EIO, "Expected chunk to be cached after fetch");
    }

    cachedChunks.push(maybeCachedChunk);
  }

  return Buffer.concat([...cachedChunks, ...fetchedChunks]);
}

import { logger } from "@repo/core-util-logger";

import { chunkCache } from "../chunk-cache.ts";
import { createStreamRequest } from "../requests/create-stream-request.ts";
import { createChunkCacheKey } from "./create-chunk-cache-key.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export const fetchDiscreteByteRange = async (
  fileHandle: FileHandleMetadata,
  start: number,
  end: number,
  shouldCache = true,
) => {
  const response = await createStreamRequest(fileHandle, start, end);
  const data = await response.body.arrayBuffer();
  const buffer = Buffer.from(data);

  if (shouldCache) {
    logger.silly(
      `Caching discrete byte range ${start.toString()}-${end.toString()} (${buffer.byteLength.toString()} bytes) for file ${fileHandle.fileName}`,
    );

    chunkCache.set(createChunkCacheKey(fileHandle.fileId, start, end), buffer);
  }

  return buffer;
};

import { Buffer } from "node:buffer";

import { logger } from "../../../utilities/logger/logger.ts";
import { chunkCache } from "../chunk-cache.ts";
import { createStreamRequest } from "../requests/create-stream-request.ts";
import { createChunkCacheKey } from "./create-chunk-cache-key.ts";

import type { MediaFileHandleMetadata } from "../file-handle-map.ts";

export const fetchDiscreteByteRange = async (
  fd: number,
  fileHandle: MediaFileHandleMetadata,
  [start, end]: readonly [number, number],
  shouldCache = true,
) => {
  const response = await createStreamRequest(fd, fileHandle.url, [start, end]);
  const data = await response.body.arrayBuffer();
  const buffer = Buffer.from(data);

  if (shouldCache) {
    logger.silly(
      `Caching discrete byte range ${start.toString()}-${end.toString()} (${buffer.byteLength.toString()} bytes) for file ${fileHandle.filePath}`,
    );

    chunkCache.set(
      createChunkCacheKey(fileHandle.originalFileName, start, end),
      buffer,
    );
  }

  return buffer;
};

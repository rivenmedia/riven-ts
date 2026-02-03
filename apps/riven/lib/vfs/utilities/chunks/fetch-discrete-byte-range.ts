import { Buffer } from "node:buffer";

import { logger } from "../../../utilities/logger/logger.ts";
import { chunkCache } from "../chunk-cache.ts";
import { createStreamRequest } from "../requests/create-stream-request.ts";
import { createChunkCacheKey } from "./create-chunk-cache-key.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export const fetchDiscreteByteRange = async (
  fileHandle: FileHandleMetadata,
  [start, end]: readonly [number, number],
  shouldCache = true,
) => {
  const response = await createStreamRequest(fileHandle.url, [start, end]);
  const data = await response.body.arrayBuffer();
  const buffer = Buffer.from(data);

  if (shouldCache) {
    logger.silly(
      `Caching discrete byte range ${start.toString()}-${end.toString()} (${buffer.byteLength.toString()} bytes) for file ${fileHandle.fileName}`,
    );

    chunkCache.set(
      createChunkCacheKey(fileHandle.fileName, start, end),
      buffer,
    );
  }

  return buffer;
};
